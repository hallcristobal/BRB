interface IConfig {
  Colors: string[],
  Objects: { text: null | string, duplicates: null | number }[],
  Speed: number | null,
  Debug: number | null,
  FontSize: number | null,
  FontFamily: string | null,
}

declare var glMatrix: any;