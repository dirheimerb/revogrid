import {Component, Prop, h, Watch, Element, Listen} from '@stencil/core';


import {setData, setColumn} from '../../store/data.store';
import {setSettings} from '../../store/dimension.store';
import {setViewport} from '../../store/viewport.store';
import {ColumnData, DataType, InitialSettings, MultiDimensionAction, SaveDataDetails} from '../../interfaces';
import GridResize from '../../services/gridResize';
import moduleRegister from '../../services/moduleRegister';
import {UUID, VIEWPORT_CLASS} from '../../services/consts';
import dimensionProvider from '../../services/dimension.provider';
import dataProvider from "../../services/data.provider";


const initialSettings: InitialSettings = {
  defaultColumnSize: 80,
  defaultRowSize: 30,
  frameSize: 0,
  dimensions: undefined,
  readonly: false,
  range: false
};

@Component({
  tag: 'revo-grid',
  styleUrl: 'revo-grid.scss'
})
export class RevoGrid {
  private viewport: HTMLRevogrViewportScrollableElement;
  private uuid: number|null = null;

  @Element() element: HTMLElement;

  @Prop() frameSize: number = initialSettings.frameSize;
  @Prop() rowSize: number = initialSettings.defaultRowSize;
  @Prop() colSize: number = initialSettings.defaultColumnSize;
  @Prop() range: boolean = initialSettings.range;
  @Prop() readonly: boolean = initialSettings.readonly;
  @Prop() dimensions: Partial<MultiDimensionAction> = {};

  // data is array of objects
  @Prop() source: DataType[] = [];
  @Watch('source')
  dataChanged(newVal: DataType[]): void {
    setData(newVal);
  }

  // if source provided as object header 'prop' will link to the object field
  @Prop() columns: ColumnData = [];
  @Watch('columns')
  columnChanged(newVal: ColumnData) {
    setColumn(newVal);
  }

  @Listen('beforeEdit')
  beforeSave(e: CustomEvent<SaveDataDetails>): void {
    setTimeout(() => {
      if (!e.defaultPrevented) {
        dataProvider.setData(e.detail.row, e.detail.col, e.detail.val);
      }
    }, 0);
  }

  connectedCallback(): void {
    this.uuid = (new Date()).getTime();
    moduleRegister.baseClass = `.${VIEWPORT_CLASS}[${UUID}='${this.uuid}']`;

    setViewport({ frameOffset: this.frameSize || 0 }, 'row');
    setViewport({ frameOffset: this.frameSize || 0 }, 'col');
    setSettings(this.rowSize, 'row');
    setSettings(this.colSize, 'col');

    dimensionProvider.setSize(this.dimensions.row, 'row');
    dimensionProvider.setSize(this.dimensions.col, 'col');
    this.columnChanged(this.columns);
    this.dataChanged(this.source);
  }

  async componentDidLoad(): Promise<void> {
    moduleRegister.register('resize', new GridResize(this.element, this.viewport));
  }

  disconnectedCallback(): void {
    moduleRegister.destroy();
  }

  render() {
    const viewportProp = {
      class: `viewport ${VIEWPORT_CLASS}`,
      [`${UUID}`]: this.uuid,
      ref: (el: HTMLRevogrViewportScrollableElement) => { this.viewport = el; }
    };
    return <revogr-viewport-scrollable{...viewportProp}>
      <revogr-header slot='header' class='header'/>
      <revogr-data slot='content' class='viewport-layer'/>
      {
        !this.readonly || this.range ? <revogr-overlay-selection slot='content' range={this.range}/> : ''
      }
      {
        !this.readonly ? <revogr-edit slot='content'/> : ''
      }
    </revogr-viewport-scrollable>;
  }
}
