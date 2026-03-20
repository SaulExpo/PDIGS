import { Component, OnInit } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-map',
  imports: [GoogleMapsModule, TranslatePipe],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit {
  center: google.maps.LatLngLiteral = {lat: 40.4168, lng: -3.7038}; // Madrid por defecto
  zoom = 12;
  mapOptions: google.maps.MapOptions = {
    center: this.center,
    zoom: this.zoom
  };

  ngOnInit() {
    this.getUserLocation();
  }

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.center = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.mapOptions = {
            ...this.mapOptions,
            center: this.center
          };
        },
        (error) => {
          console.error('Error getting location:', error);
          // Mantener ubicación por defecto
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }
}
