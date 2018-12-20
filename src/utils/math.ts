export class MathUtil {
  public static getBaseLog(x: number, y: number): number {
    return Math.round(Math.log(y) / Math.log(x));
  }
}
