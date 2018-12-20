import { MathUtil } from './math';
describe('Math Util', () => {
  it('should return correct getBaseLog result', () => {
    expect(MathUtil.getBaseLog(2, 8)).toEqual(3);
    expect(MathUtil.getBaseLog(2, 16)).toEqual(4);
    expect(MathUtil.getBaseLog(3, 9)).toEqual(2);
    expect(MathUtil.getBaseLog(3, 27)).toEqual(3);
  });
});
