import { DecimalPipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleMap, GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { TranslatePipe } from '../../i18n/translate.pipe';

type VetServiceFilter = 'all' | 'emergency' | 'grooming' | 'exotic' | 'vaccination';

interface ServiceOption {
  value: VetServiceFilter;
  labelKey: string;
  keyword?: string;
}

interface VetPlace {
  placeId: string;
  name: string;
  address: string;
  location: google.maps.LatLngLiteral;
  distanceKm: number;
  website?: string;
  phone?: string;
  openingHours?: string[];
  googleMapsUrl?: string;
  matchedServices: string[];
  detailsLoaded?: boolean;
}

interface VetMarker {
  placeId: string;
  position: google.maps.LatLngLiteral;
  title: string;
  options: google.maps.MarkerOptions;
}

@Component({
  selector: 'app-map',
  imports: [DecimalPipe, FormsModule, GoogleMapsModule, TranslatePipe],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit {
  @ViewChild(GoogleMap) googleMap?: GoogleMap;
  @ViewChild(MapInfoWindow) infoWindow?: MapInfoWindow;

  readonly radiusOptions = [
    { label: '3 km', value: 3000 },
    { label: '5 km', value: 5000 },
    { label: '10 km', value: 10000 },
    { label: '20 km', value: 20000 }
  ];

  readonly serviceOptions: ServiceOption[] = [
    { value: 'all', labelKey: 'map.service.all' },
    { value: 'emergency', labelKey: 'map.service.emergency', keyword: 'emergency veterinary' },
    { value: 'grooming', labelKey: 'map.service.grooming', keyword: 'pet grooming veterinary' },
    { value: 'exotic', labelKey: 'map.service.exotic', keyword: 'exotic pet veterinary' },
    { value: 'vaccination', labelKey: 'map.service.vaccination', keyword: 'pet vaccination veterinary' }
  ];

  center: google.maps.LatLngLiteral = { lat: 40.4168, lng: -3.7038 };
  userLocation: google.maps.LatLngLiteral | null = null;
  zoom = 13;
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    clickableIcons: true,
    gestureHandling: 'greedy',
    mapTypeControl: false,
    streetViewControl: false
  };
  userLocationMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 9,
      fillColor: '#1f9d68',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    }
  };

  searchQuery = '';
  selectedRadius = 5000;
  selectedService: VetServiceFilter = 'all';
  searchError = '';
  debugErrorMessage = '';
  locationStatusKey = 'map.location.loading';
  isSearching = false;
  canSearchThisArea = false;
  hasSearched = false;

  vetResults: VetPlace[] = [];
  mapMarkers: VetMarker[] = [];
  selectedVet: VetPlace | null = null;
  selectedMarkerTitle = '';
  selectedMarkerPosition: google.maps.LatLngLiteral | null = null;

  private mapInstance?: google.maps.Map;
  private placesReady = false;
  private lastSearchCenter?: google.maps.LatLngLiteral;
  private pendingInitialSearch = false;

  ngOnInit() {
    this.getUserLocation(false);
  }

  async onMapInitialized(map: google.maps.Map) {
    this.mapInstance = map;
    try {
      await google.maps.importLibrary('places');
      this.placesReady = true;
    } catch {
      this.searchError = 'map.apiError';
    }

    if (this.pendingInitialSearch) {
      this.pendingInitialSearch = false;
      this.searchNearby();
    }
  }

  onMapIdle() {
    if (!this.mapInstance) {
      return;
    }

    const currentCenter = this.mapInstance.getCenter();
    if (!currentCenter) {
      return;
    }

    const nextCenter = {
      lat: currentCenter.lat(),
      lng: currentCenter.lng()
    };

    if (this.computeDistanceMeters(nextCenter, this.center) > 50) {
      this.center = nextCenter;
    }

    if (!this.lastSearchCenter) {
      return;
    }

    const movedDistance = this.computeDistanceMeters(nextCenter, this.lastSearchCenter);
    this.canSearchThisArea = movedDistance > 300;
  }

  searchNearby() {
    this.runSearch(this.center);
  }

  searchCurrentArea() {
    this.runSearch(this.center);
  }

  goToMyLocation() {
    this.getUserLocation(true);
  }

  async selectVet(vet: VetPlace, marker?: MapMarker) {
    this.selectedVet = vet;

    if (marker) {
      this.selectedMarkerTitle = vet.name;
      this.selectedMarkerPosition = vet.location;
      this.infoWindow?.open(marker);
    }

    if (vet.detailsLoaded || (vet.website && vet.phone && vet.openingHours?.length)) {
      return;
    }

    try {
      const details = await this.getPlaceDetails(vet.placeId);
      const merged: VetPlace = {
        ...vet,
        address: details.address || vet.address,
        website: details.website || vet.website,
        phone: details.phone || vet.phone,
        openingHours: details.openingHours?.length ? details.openingHours : vet.openingHours,
        googleMapsUrl: details.googleMapsUrl || vet.googleMapsUrl,
        matchedServices: this.mergeServices(vet.matchedServices, this.detectServices(details.name, details.types)),
        detailsLoaded: true
      };

      this.vetResults = this.vetResults.map((item) => item.placeId === merged.placeId ? merged : item);
      this.selectedVet = merged;
    } catch {
      // Keep the basic result if Google details fail.
    }
  }

  get selectedServiceLabel(): string {
    return this.serviceOptions.find((option) => option.value === this.selectedService)?.labelKey ?? 'map.service.all';
  }

  get zoneLabel(): string {
    return `${this.center.lat.toFixed(3)}, ${this.center.lng.toFixed(3)}`;
  }

  get hasResults(): boolean {
    return this.vetResults.length > 0;
  }

  openInMaps(vet: VetPlace) {
    window.open(this.buildMapsSearchUrl(vet), '_blank', 'noopener');
  }

  openDirections(vet: VetPlace) {
    const destination = `${vet.location.lat},${vet.location.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&destination_place_id=${encodeURIComponent(vet.placeId)}`;
    window.open(url, '_blank', 'noopener');
  }

  private getUserLocation(searchAfterLocate: boolean) {
    if (!navigator.geolocation) {
      this.locationStatusKey = 'map.location.unsupported';
      if (searchAfterLocate) {
        this.searchNearby();
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.center = this.userLocation;
        this.zoom = 13;
        this.locationStatusKey = 'map.location.active';
        this.mapOptions = {
          ...this.mapOptions,
          center: this.center,
          zoom: this.zoom
        };

        if (this.mapInstance) {
          this.mapInstance.panTo(this.center);
          this.mapInstance.setZoom(this.zoom);
        }

        if (searchAfterLocate || !this.hasSearched) {
          this.searchNearby();
        }
      },
      () => {
        this.userLocation = null;
        this.locationStatusKey = 'map.location.fallback';
        if (searchAfterLocate || !this.hasSearched) {
          this.searchNearby();
        }
      }
    );
  }

  private async runSearch(center: google.maps.LatLngLiteral) {
    if (!this.ensurePlacesReady()) {
      return;
    }

    this.isSearching = true;
    this.searchError = '';
    this.debugErrorMessage = '';
    this.canSearchThisArea = false;
    this.lastSearchCenter = center;

    try {
      const results = await this.searchPlaces(center);
      this.vetResults = results;
      this.mapMarkers = this.buildMarkers(results);
      this.selectedVet = results[0] ?? null;
      this.hasSearched = true;

      if (!results.length) {
        this.searchError = 'map.noResults';
      }
    } catch (error) {
      this.vetResults = [];
      this.mapMarkers = [];
      this.selectedVet = null;
      this.debugErrorMessage = this.getRawErrorMessage(error);
      console.error('Google Places search failed:', error);
      this.searchError = this.resolvePlacesError(error);
    } finally {
      this.isSearching = false;
    }
  }

  private ensurePlacesReady(): boolean {
    if (typeof google === 'undefined' || !google.maps?.places) {
      this.searchError = 'map.apiError';
      return false;
    }

    if (this.placesReady) {
      return true;
    }

    this.pendingInitialSearch = true;
    return false;
  }

  private async searchPlaces(center: google.maps.LatLngLiteral): Promise<VetPlace[]> {
    const PlaceCtor = (google.maps.places as any).Place;
    const request: any = {
      fields: ['id', 'displayName', 'formattedAddress', 'location', 'googleMapsURI', 'types', 'primaryType'],
      locationRestriction: {
        center,
        radius: this.selectedRadius
      },
      includedPrimaryTypes: ['veterinary_care'],
      maxResultCount: 20,
      rankPreference: 'DISTANCE'
    };
    const serviceKeyword = this.getSelectedServiceKeyword();
    const nameQuery = this.searchQuery.trim().toLowerCase();
    const textSearchTerms = [this.searchQuery.trim(), serviceKeyword].filter(Boolean).join(' ').trim();

    let places: any[] = [];

    if (textSearchTerms) {
      try {
        const textSearchRequest: any = {
          fields: request.fields,
          textQuery: `${textSearchTerms} veterinary`,
          locationBias: {
            center,
            radius: this.selectedRadius
          },
          locationRestriction: {
            center,
            radius: this.selectedRadius
          },
          maxResultCount: 20
        };

        const textSearchResponse = await PlaceCtor.searchByText(textSearchRequest);
        places = textSearchResponse?.places ?? [];
      } catch {
        const nearbyFallback = await PlaceCtor.searchNearby(request);
        places = nearbyFallback?.places ?? [];
      }
    } else {
      const nearbyResponse = await PlaceCtor.searchNearby(request);
      places = nearbyResponse?.places ?? [];
    }

    const origin = new google.maps.LatLng(center.lat, center.lng);

    return places
      .filter((place: any) =>
        Boolean(place?.id && place?.location)
      )
      .map((place: any) => {
        const placeLocation = place.location!;
        const location = {
          lat: placeLocation.lat(),
          lng: placeLocation.lng()
        };
        const distanceKm = google.maps.geometry.spherical.computeDistanceBetween(
          origin,
          placeLocation
        ) / 1000;

        const matchedServices = this.detectServices(place.displayName, place.types);

        if (this.selectedService !== 'all' && !matchedServices.includes(this.getServiceLabel(this.selectedService))) {
          matchedServices.push(this.getServiceLabel(this.selectedService));
        }

        return {
          placeId: place.id!,
          name: place.displayName || 'Veterinary clinic',
          address: place.formattedAddress || '',
          location,
          distanceKm,
          googleMapsUrl: place.googleMapsURI || this.buildMapsSearchUrl({
            placeId: place.id!,
            location
          }),
          matchedServices: this.mergeServices([], matchedServices),
          detailsLoaded: false
        };
      })
      .filter((place: VetPlace) => {
        if (nameQuery && !`${place.name} ${place.address}`.toLowerCase().includes(nameQuery)) {
          return false;
        }

        if (this.selectedService === 'all') {
          return true;
        }

        return place.matchedServices.includes(this.getServiceLabel(this.selectedService));
      })
      .sort((a: VetPlace, b: VetPlace) => a.distanceKm - b.distanceKm)
      .filter((place: VetPlace, index: number, array: VetPlace[]) => array.findIndex((item: VetPlace) => item.placeId === place.placeId) === index);
  }

  private getPlaceDetails(placeId: string): Promise<{
    name?: string;
    address?: string;
    phone?: string;
    website?: string;
    openingHours?: string[];
    googleMapsUrl?: string;
    types?: string[];
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        const PlaceCtor = (google.maps.places as any).Place;
        const place = new PlaceCtor({ id: placeId });
        await place.fetchFields({
          fields: [
            'displayName',
            'formattedAddress',
            'googleMapsURI',
            'location',
            'nationalPhoneNumber',
            'regularOpeningHours',
            'types',
            'websiteURI'
          ]
        });

        resolve({
          name: place.displayName,
          address: place.formattedAddress,
          phone: place.nationalPhoneNumber,
          website: place.websiteURI,
          openingHours: place.regularOpeningHours?.weekdayDescriptions,
          googleMapsUrl: place.googleMapsURI,
          types: place.types
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private detectServices(name?: string, types?: string[]): string[] {
    const haystack = `${name || ''} ${(types || []).join(' ')}`.toLowerCase();
    const matches: string[] = [];

    if (haystack.includes('emergency') || haystack.includes('hospital')) {
      matches.push(this.getServiceLabel('emergency'));
    }
    if (haystack.includes('groom')) {
      matches.push(this.getServiceLabel('grooming'));
    }
    if (haystack.includes('exotic')) {
      matches.push(this.getServiceLabel('exotic'));
    }
    if (haystack.includes('vaccin')) {
      matches.push(this.getServiceLabel('vaccination'));
    }

    if (!matches.length) {
      matches.push('General vet');
    }

    return matches;
  }

  private mergeServices(current: string[], incoming: string[]): string[] {
    return [...new Set([...current, ...incoming])];
  }

  private getServiceLabel(service: Exclude<VetServiceFilter, 'all'>): string {
    switch (service) {
      case 'emergency':
        return 'Emergency';
      case 'grooming':
        return 'Grooming';
      case 'exotic':
        return 'Exotic pets';
      case 'vaccination':
        return 'Vaccination';
    }
  }

  private getSelectedServiceKeyword(): string {
    return this.serviceOptions.find((option) => option.value === this.selectedService)?.keyword ?? '';
  }

  private computeDistanceMeters(a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral): number {
    return google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(a.lat, a.lng),
      new google.maps.LatLng(b.lat, b.lng)
    );
  }

  private buildMapsSearchUrl(vet: Pick<VetPlace, 'placeId' | 'location'>): string {
    const destination = `${vet.location.lat},${vet.location.lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}&query_place_id=${encodeURIComponent(vet.placeId)}`;
  }

  private buildMarkers(results: VetPlace[]): VetMarker[] {
    return results.map((vet) => ({
      placeId: vet.placeId,
      position: vet.location,
      title: vet.name,
      options: {}
    }));
  }

  private resolvePlacesError(error: unknown): string {
    const message = this.getRawErrorMessage(error);
    const normalized = message.toLowerCase();

    if (normalized.includes('request_denied') || normalized.includes('permission') || normalized.includes('api key')) {
      return 'map.requestDenied';
    }

    return 'map.error';
  }

  private getRawErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
