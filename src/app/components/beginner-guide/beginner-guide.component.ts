import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { SupportedLang, TranslationService } from '../../i18n/translation.service';

type GuideSpeciesId = 'dog' | 'cat' | 'bird' | 'reptile';

interface GuideSection {
  title: string;
  icon: string;
  tips: string[];
}

interface GuideSpeciesContent {
  id: GuideSpeciesId;
  label: string;
  heroTitle: string;
  heroDescription: string;
  quickTips: string[];
  sections: GuideSection[];
}

const GUIDE_CONTENT: Record<SupportedLang, GuideSpeciesContent[]> = {
  es: [
    {
      id: 'dog',
      label: 'Perros',
      heroTitle: 'Cuidados basicos para un perro feliz',
      heroDescription: 'Una rutina clara, paseos diarios y visitas veterinarias regulares ayudan a que tu perro se mantenga sano, activo y seguro.',
      quickTips: [
        'Manten siempre agua fresca disponible.',
        'Saca a pasear a tu perro todos los dias segun su energia y edad.',
        'Refuerza buenos comportamientos con paciencia y premios.'
      ],
      sections: [
        {
          title: 'Cuidado general',
          icon: 'fa-heart',
          tips: [
            'Prepara un espacio tranquilo para dormir y descansar.',
            'Cumple con vacunas, desparasitaciones y chequeos preventivos.',
            'Observa cambios en apetito, energia o comportamiento.'
          ]
        },
        {
          title: 'Nutricion',
          icon: 'fa-utensils',
          tips: [
            'Usa alimento adecuado para su tamano y etapa de vida.',
            'Evita chocolate, cebolla, huesos cocidos y comida muy salada.',
            'Controla porciones para prevenir sobrepeso.'
          ]
        },
        {
          title: 'Higiene',
          icon: 'fa-soap',
          tips: [
            'Cepilla el pelaje con frecuencia para reducir nudos y suciedad.',
            'Bana solo cuando sea necesario usando productos para perros.',
            'Revisa orejas, dientes y unas como parte de la rutina.'
          ]
        }
      ]
    },
    {
      id: 'cat',
      label: 'Gatos',
      heroTitle: 'Rutinas sencillas para cuidar a tu gato',
      heroDescription: 'Los gatos necesitan un ambiente limpio, enriquecido y seguro para mantenerse tranquilos, curiosos y saludables.',
      quickTips: [
        'Limpia la caja de arena todos los dias.',
        'Ofrece zonas altas o escondites para que se sienta seguro.',
        'Reserva momentos cortos de juego interactivo.'
      ],
      sections: [
        {
          title: 'Cuidado general',
          icon: 'fa-heart',
          tips: [
            'Mantelo dentro de casa o en espacios protegidos.',
            'Programa revisiones veterinarias y esterilizacion si corresponde.',
            'Asegura ventanas, plantas y objetos peligrosos.'
          ]
        },
        {
          title: 'Nutricion',
          icon: 'fa-utensils',
          tips: [
            'Elige comida formulada para gatos, rica en proteina animal.',
            'Mantiene horarios estables para reducir ansiedad.',
            'Evita leche, huesos y restos de comida humana.'
          ]
        },
        {
          title: 'Higiene',
          icon: 'fa-soap',
          tips: [
            'Cepilla el pelaje segun el tipo de pelo.',
            'Mantiene limpia la caja de arena y alejada del comedero.',
            'Vigila ojos, dientes y unas con frecuencia.'
          ]
        }
      ]
    },
    {
      id: 'bird',
      label: 'Aves',
      heroTitle: 'Bienestar diario para aves de compania',
      heroDescription: 'Las aves requieren limpieza, estimulacion mental y una dieta equilibrada para evitar estres y problemas respiratorios.',
      quickTips: [
        'Coloca la jaula en un lugar iluminado, sin corrientes fuertes.',
        'Cambia agua y restos de comida a diario.',
        'Habla y socializa con tu ave de forma calmada.'
      ],
      sections: [
        {
          title: 'Cuidado general',
          icon: 'fa-heart',
          tips: [
            'Usa una jaula amplia que permita abrir alas y moverse.',
            'Incluye juguetes y perchas de distintos tamanos.',
            'Evita humo, aerosoles y vapores fuertes cerca del ave.'
          ]
        },
        {
          title: 'Nutricion',
          icon: 'fa-utensils',
          tips: [
            'Combina pellets o semillas con fruta y verdura segun la especie.',
            'Investiga alimentos toxicos como aguacate o chocolate.',
            'Retira comida fresca antes de que se estropee.'
          ]
        },
        {
          title: 'Higiene',
          icon: 'fa-soap',
          tips: [
            'Limpia base, comederos y bebederos varias veces por semana.',
            'Ofrece banos suaves o recipientes para que se aseen.',
            'Observa plumas opacas o suciedad persistente como senal de alerta.'
          ]
        }
      ]
    },
    {
      id: 'reptile',
      label: 'Reptiles',
      heroTitle: 'Puntos clave para reptiles principiantes',
      heroDescription: 'En reptiles, el habitat correcto es tan importante como la comida. Temperatura, luz y humedad deben estar controladas todos los dias.',
      quickTips: [
        'Comprueba temperatura y humedad con medidores confiables.',
        'Investiga si tu especie necesita luz UVB.',
        'Manipula al reptil con suavidad y solo cuando sea necesario.'
      ],
      sections: [
        {
          title: 'Cuidado general',
          icon: 'fa-heart',
          tips: [
            'Adapta el terrario al tamano y comportamiento de la especie.',
            'Incluye refugios, sustrato seguro y zonas fria/caliente.',
            'Reduce el estres evitando ruido y manejo excesivo.'
          ]
        },
        {
          title: 'Nutricion',
          icon: 'fa-utensils',
          tips: [
            'Cada especie tiene una dieta distinta: insectos, vegetales o ambos.',
            'Suplementa calcio y vitaminas cuando el veterinario lo recomiende.',
            'No dejes presas vivas sin supervision dentro del terrario.'
          ]
        },
        {
          title: 'Higiene',
          icon: 'fa-soap',
          tips: [
            'Retira restos de comida y heces a diario.',
            'Desinfecta accesorios y cambia el sustrato segun necesidad.',
            'Lavate las manos antes y despues de manipular al reptil.'
          ]
        }
      ]
    }
  ],
  en: [
    {
      id: 'dog',
      label: 'Dogs',
      heroTitle: 'Basic care for a happy dog',
      heroDescription: 'A clear routine, daily walks, and regular vet visits help your dog stay healthy, active, and safe.',
      quickTips: [
        'Keep fresh water available at all times.',
        'Walk your dog every day based on age and energy level.',
        'Reinforce good behavior with patience and rewards.'
      ],
      sections: [
        {
          title: 'General care',
          icon: 'fa-heart',
          tips: [
            'Set up a calm place to sleep and rest.',
            'Stay current on vaccines, deworming, and preventive care.',
            'Watch for changes in appetite, energy, or behavior.'
          ]
        },
        {
          title: 'Nutrition',
          icon: 'fa-utensils',
          tips: [
            'Use food that matches your dog size and life stage.',
            'Avoid chocolate, onions, cooked bones, and very salty foods.',
            'Control portions to prevent unhealthy weight gain.'
          ]
        },
        {
          title: 'Hygiene',
          icon: 'fa-soap',
          tips: [
            'Brush the coat regularly to reduce dirt and tangles.',
            'Bathe only when needed using dog-safe products.',
            'Check ears, teeth, and nails as part of the routine.'
          ]
        }
      ]
    },
    {
      id: 'cat',
      label: 'Cats',
      heroTitle: 'Simple routines to care for your cat',
      heroDescription: 'Cats need a clean, enriched, and safe environment to stay calm, curious, and healthy.',
      quickTips: [
        'Clean the litter box every day.',
        'Offer vertical spaces or hiding spots for safety.',
        'Set aside short moments for interactive play.'
      ],
      sections: [
        {
          title: 'General care',
          icon: 'fa-heart',
          tips: [
            'Keep your cat indoors or in protected areas.',
            'Schedule vet checkups and spay/neuter care when appropriate.',
            'Secure windows, plants, and hazardous items.'
          ]
        },
        {
          title: 'Nutrition',
          icon: 'fa-utensils',
          tips: [
            'Choose cat food rich in animal protein.',
            'Keep mealtimes consistent to reduce stress.',
            'Avoid milk, bones, and leftover human food.'
          ]
        },
        {
          title: 'Hygiene',
          icon: 'fa-soap',
          tips: [
            'Brush the coat based on hair length and shedding.',
            'Keep the litter box clean and away from food bowls.',
            'Check eyes, teeth, and claws regularly.'
          ]
        }
      ]
    },
    {
      id: 'bird',
      label: 'Birds',
      heroTitle: 'Everyday wellness for pet birds',
      heroDescription: 'Birds need cleanliness, mental stimulation, and a balanced diet to avoid stress and respiratory issues.',
      quickTips: [
        'Place the cage in a bright area away from strong drafts.',
        'Refresh water and remove leftover food every day.',
        'Talk and socialize with your bird in a calm way.'
      ],
      sections: [
        {
          title: 'General care',
          icon: 'fa-heart',
          tips: [
            'Use a roomy cage that allows wing movement.',
            'Add toys and perches with different sizes and textures.',
            'Keep smoke, aerosols, and strong fumes away from birds.'
          ]
        },
        {
          title: 'Nutrition',
          icon: 'fa-utensils',
          tips: [
            'Combine pellets or seeds with fruit and vegetables for the species.',
            'Research toxic foods such as avocado or chocolate.',
            'Remove fresh food before it spoils.'
          ]
        },
        {
          title: 'Hygiene',
          icon: 'fa-soap',
          tips: [
            'Clean the base, food bowls, and water containers several times a week.',
            'Offer gentle baths or dishes so the bird can groom.',
            'Watch for dull feathers or persistent dirt as warning signs.'
          ]
        }
      ]
    },
    {
      id: 'reptile',
      label: 'Reptiles',
      heroTitle: 'Key basics for beginner reptile care',
      heroDescription: 'For reptiles, the habitat matters as much as food. Temperature, lighting, and humidity must be checked every day.',
      quickTips: [
        'Check temperature and humidity with reliable gauges.',
        'Find out whether your species needs UVB lighting.',
        'Handle your reptile gently and only when necessary.'
      ],
      sections: [
        {
          title: 'General care',
          icon: 'fa-heart',
          tips: [
            'Match the terrarium to the size and behavior of the species.',
            'Include hides, safe substrate, and cool/warm zones.',
            'Reduce stress by avoiding excess noise and handling.'
          ]
        },
        {
          title: 'Nutrition',
          icon: 'fa-utensils',
          tips: [
            'Each species has its own diet: insects, greens, or a mix.',
            'Add calcium and vitamins only when appropriate for the species or vet advice.',
            'Do not leave live prey unsupervised in the enclosure.'
          ]
        },
        {
          title: 'Hygiene',
          icon: 'fa-soap',
          tips: [
            'Remove leftover food and waste every day.',
            'Disinfect accessories and replace substrate as needed.',
            'Wash your hands before and after handling reptiles.'
          ]
        }
      ]
    }
  ]
};

@Component({
  selector: 'app-beginner-guide',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './beginner-guide.component.html',
  styleUrl: './beginner-guide.component.css'
})
export class BeginnerGuideComponent implements OnDestroy {
  selectedSpeciesId: GuideSpeciesId = 'dog';
  isPageTurning = false;
  turnDirection: 'forward' | 'backward' = 'forward';
  private translation = inject(TranslationService);
  private turnTimeoutId: number | null = null;

  get speciesList(): GuideSpeciesContent[] {
    return GUIDE_CONTENT[this.translation.getLanguage()];
  }

  get selectedSpecies(): GuideSpeciesContent {
    return this.speciesList.find((species) => species.id === this.selectedSpeciesId) ?? this.speciesList[0];
  }

  selectSpecies(speciesId: GuideSpeciesId) {
    if (speciesId === this.selectedSpeciesId) {
      return;
    }

    const currentIndex = this.speciesList.findIndex((species) => species.id === this.selectedSpeciesId);
    const nextIndex = this.speciesList.findIndex((species) => species.id === speciesId);

    this.turnDirection = nextIndex >= currentIndex ? 'forward' : 'backward';
    this.selectedSpeciesId = speciesId;
    this.restartPageTurn();
  }

  ngOnDestroy() {
    if (this.turnTimeoutId !== null) {
      window.clearTimeout(this.turnTimeoutId);
    }
  }

  private restartPageTurn() {
    this.isPageTurning = false;

    if (this.turnTimeoutId !== null) {
      window.clearTimeout(this.turnTimeoutId);
    }

    window.setTimeout(() => {
      this.isPageTurning = true;
      this.turnTimeoutId = window.setTimeout(() => {
        this.isPageTurning = false;
        this.turnTimeoutId = null;
      }, 700);
    }, 20);
  }
}
