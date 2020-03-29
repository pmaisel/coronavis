import {Component, EventEmitter, Input, OnInit, Output, Inject, LOCALE_ID} from '@angular/core';
import {AggregationLevel} from '../map/options/aggregation-level.enum';
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseOptions,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from '../map/options/covid-number-case-options';
import { ColormapService } from '../services/colormap.service';
import { BedType } from '../map/options/bed-type.enum';
import { BedGlyphOptions } from '../map/options/bed-glyph-options';
import { MapOptions } from '../map/options/map-options';
import { MatDialog } from '@angular/material/dialog';
import { AboutComponent } from '../about/about.component';
import { ImpressumComponent } from '../impressum/impressum.component';

@Component({
  selector: 'app-infobox',
  templateUrl: './infobox.component.html',
  styleUrls: ['./infobox.component.less']
})
export class InfoboxComponent implements OnInit {

  constructor(
    private colormapService: ColormapService,
    private dialogService: MatDialog,
    @Inject(LOCALE_ID) protected localeId: string
  ) { }

  glyphLegend;

  glyphLegendColors = ColormapService.bedStati;

  infoboxExtended = true;

  @Input('mapOptions')
  mo: MapOptions;

  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

  // ENUM MAPPING
  // because in HTML, this stuff cannot be accessed
  eCovidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;

  eCovidNumberCaseChange = CovidNumberCaseChange;

  eCovidNumberCaseType = CovidNumberCaseType;

  eCovidNumberCaseNormalization = CovidNumberCaseNormalization;

  eBedTypes = BedType;

  eAggregationLevels = AggregationLevel;

  locales: string[] = [
    'en',
    'de'
  ];

  selectedLocale: string;

  ngOnInit(): void {
    console.log('locale', this.localeId);

    if(this.locales.indexOf(this.localeId) > -1) {
      this.selectedLocale = this.localeId;
    } else {
      this.selectedLocale = 'en';
    }

    this.glyphLegend = [
      {name: 'ICU low', accessor: 'showIcuLow', color: this.glyphLegendColors[1] , description: 'ICU low care = Monitoring, nicht-invasive Beatmung (NIV), keine Organersatztherapie'}, 
      {name: 'ICU high', accessor: 'showIcuHigh', color: this.glyphLegendColors[0], description: 'ICU high care = Monitoring, invasive Beatmung, Organersatztherapie, vollständige intensivmedizinische Therapiemöglichkeiten'}, 
      {name: 'ECMO', accessor: 'showEcmo', color: this.glyphLegendColors[2], description: 'ECMO = Zusätzlich ECMO'}
    ];
  }

  emitCaseChoroplethOptions() {
    // console.log('emit', this.caseChoroplethOptions);

    if(this.mo.covidNumberCaseOptions.change === CovidNumberCaseChange.relative) {
      this.mo.covidNumberCaseOptions.normalization = CovidNumberCaseNormalization.absolut;

      if (this.mo.covidNumberCaseOptions.timeWindow === CovidNumberCaseTimeWindow.all) {
        this.mo.covidNumberCaseOptions.timeWindow = CovidNumberCaseTimeWindow.twentyFourhours;
      }
    }

    this.emitMapOptions();
  }

  getGlyphColor(str: string) {
    return this.colormapService.getSingleHospitalColormap()(str);
  }

  updateBedBackgroundBedType(state: BedType) {
    if(this.mo.bedGlyphOptions.aggregationLevel === AggregationLevel.none) {
      return;
    }

    this.mo.bedBackgroundOptions.bedType = state;

    this.emitMapOptions();
  }

  updateBedGlyphAggregationLevel(lvl: AggregationLevel) {
    this.mo.bedGlyphOptions.aggregationLevel = lvl;

    if(lvl === AggregationLevel.none) {
      this.mo.bedBackgroundOptions.enabled = false;
    } else {
      this.mo.bedBackgroundOptions.aggregationLevel = lvl;
    }

    this.emitMapOptions();
  }

  updateCovidNumberCaseOptionsEnabled(enabled: boolean) {
    this.mo.covidNumberCaseOptions.enabled = enabled; 
    
    if(enabled) {
      this.mo.bedBackgroundOptions.enabled = false;
    }
    
    this.emitMapOptions()
  }

  updateBedBackgroundOptionsEnabled(enabled: boolean) {
    this.mo.bedBackgroundOptions.enabled = enabled;

    if(enabled) {
      this.mo.covidNumberCaseOptions.enabled = false;
    }

    this.emitMapOptions()
  }

  emitMapOptions() {
    this.mapOptionsChange.emit({...this.mo});
  }

  openAbout() {
    this.dialogService.open(AboutComponent, {
		panelClass: 'popup-panel-white-glass-background'
	});
  }

  openImpressum() {
    this.dialogService.open(ImpressumComponent);
  }

  changeLocale(evt) {
    location.href = `/${evt.value}/`;
  }

}
