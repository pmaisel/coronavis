import {Component, EventEmitter, Input, OnInit, Output, Inject, LOCALE_ID} from '@angular/core';
import {AggregationLevel} from '../map/options/aggregation-level.enum';
import {
  CovidNumberCaseChange,
  CovidNumberCaseNormalization,
  CovidNumberCaseTimeWindow,
  CovidNumberCaseType
} from '../map/options/covid-number-case-options';
import { BedType } from '../map/options/bed-type.enum';
import { MapOptions } from '../map/options/map-options';
import { MatDialog } from '@angular/material/dialog';
import { AboutComponent } from '../about/about.component';
import { ImpressumComponent } from '../impressum/impressum.component';
import { OSMLayerService } from '../services/osm-layer.service';
import { GlyphLayerService } from '../services/glyph-layer.service';
import { BedChoroplethLayerService } from '../services/bed-choropleth-layer.service';
import { CaseChoroplethLayerService } from '../services/case-choropleth-layer.service';
import {APP_CONFIG_KEY} from "../../constants";
import { QualitativeColormapService } from '../services/qualitative-colormap.service';
import { HelpDialogComponent } from '../help-dialog/help-dialog.component';
import { SupportedLocales, I18nService } from '../services/i18n.service';
import {BreakpointObserver} from "@angular/cdk/layout";
import { CountryAggregatorService } from '../services/country-aggregator.service';
import { QualitativeTimedStatusAggregation } from '../services/types/qualitateive-timed-status-aggregation';
import { QuantitativeAggregatedHospitalProperties } from '../repositories/types/in/qualitative-hospitals-development';
import { QuantitativeAggregatedRkiCaseNumberProperties, QuantitativeAggregatedRkiCasesProperties } from '../repositories/types/in/quantitative-aggregated-rki-cases';
import { TooltipService } from '../services/tooltip.service';

@Component({
  selector: 'app-infobox',
  templateUrl: './infobox.component.html',
  styleUrls: ['./infobox.component.less']
})
export class InfoboxComponent implements OnInit {

  constructor(
    private colormapService: QualitativeColormapService,
    private dialogService: MatDialog,
    private osmLayerService: OSMLayerService,
    private glyphLayerService: GlyphLayerService,
    private bedChoroplethLayerService: BedChoroplethLayerService,
    private caseChoroplethLayerService: CaseChoroplethLayerService,
    private i18nService: I18nService,
    private breakPointObserver: BreakpointObserver,
    private countryAggregatorService: CountryAggregatorService,
    private tooltipService: TooltipService
  ) { }

  glyphLegend;

  glyphLegendColors = QualitativeColormapService.bedStati;

  infoboxExtended = true;

  @Input('mapOptions')
  mo: MapOptions;

  @Output()
  mapOptionsChange: EventEmitter<MapOptions> = new EventEmitter();

  aggregatedDiviStatistics: QualitativeTimedStatusAggregation;

  aggregatedRkiStatistics: QuantitativeAggregatedRkiCasesProperties;

  // ENUM MAPPING
  // because in HTML, this stuff cannot be accessed
  eCovidNumberCaseTimeWindow = CovidNumberCaseTimeWindow;

  eCovidNumberCaseChange = CovidNumberCaseChange;

  eCovidNumberCaseType = CovidNumberCaseType;

  eCovidNumberCaseNormalization = CovidNumberCaseNormalization;

  eBedTypes = BedType;

  eAggregationLevels = AggregationLevel;


  supportedLocales: string[];

  selectedLocale: SupportedLocales;


  glyphLoading = false;
  bedChoroplethLoading = false;
  caseChoroplethLoading = false;
  osmLoading = false;

  ngOnInit(): void {

    //close info box if mobile
    const isSmallScreen = this.breakPointObserver.isMatched('(max-width: 500px)');
    if(isSmallScreen){
      this.infoboxExtended = false;
    }

    this.supportedLocales = this.i18nService.getSupportedLocales();

    this.i18nService.currentLocale().subscribe(l => {
      this.selectedLocale = l;
    })

    this.glyphLayerService.loading$.subscribe(l => this.glyphLoading = l);
    this.bedChoroplethLayerService.loading$.subscribe(l => this.bedChoroplethLoading = l);
    this.caseChoroplethLayerService.loading$.subscribe(l => this.caseChoroplethLoading = l);
    this.osmLayerService.loading$.subscribe(l => this.osmLoading = l);

    


    this.countryAggregatorService.diviAggregationForCountry()
    .subscribe(r => {
      this.aggregatedDiviStatistics = r;

      this.glyphLegend = [
        {name: 'ICU low', accessor: 'showIcuLow', color: this.colormapService.getBedStatusColor(r, (r) => r.icu_low_care) , description: 'ICU low care = Monitoring, nicht-invasive Beatmung (NIV), keine Organersatztherapie'},
        {name: 'ICU high', accessor: 'showIcuHigh', color: this.colormapService.getBedStatusColor(r, (r) => r.icu_high_care), description: 'ICU high care = Monitoring, invasive Beatmung, Organersatztherapie, vollständige intensivmedizinische Therapiemöglichkeiten'},
        {name: 'ECMO', accessor: 'showEcmo', color: this.colormapService.getBedStatusColor(r, (r) => r.ecmo_state), description: 'ECMO = Zusätzlich ECMO'}
      ];
    });

    this.countryAggregatorService.rkiAggregationForCountry()
    .subscribe(r => {
      this.aggregatedRkiStatistics = r;
    })
  }

  emitCaseChoroplethOptions() {

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
    localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(this.mo));
    this.mapOptionsChange.emit({...this.mo});
    console.log(this.mo);
  }

  openAbout() {
    this.dialogService.open(AboutComponent, {
		panelClass: 'popup-panel-white-glass-background'
	});
  }

  openImpressum() {
    this.dialogService.open(ImpressumComponent);
  }

  openVideo() {
    window.open('https://video.coronavis.dbvis.de', '_blank');
    // location.href = 'https://video.coronavis.dbvis.de';
  }

  changeLocale(evt) {
    this.i18nService.updateLocale(evt.value);

    const url = evt.value.slice(0,2);

    location.href = `/${url}/`;
  }


  openHelp() {
    this.dialogService.open(HelpDialogComponent);
  }
}
