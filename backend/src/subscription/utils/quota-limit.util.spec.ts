import { isUnlimitedLimit } from './quota-limit.util';

describe('quota-limit.util', () => {
    it('treats null and -1 as unlimited', () => {
        expect(isUnlimitedLimit(null)).toBe(true);
        expect(isUnlimitedLimit(-1)).toBe(true);
        expect(isUnlimitedLimit(100)).toBe(false);
        expect(isUnlimitedLimit(0)).toBe(false);
    });
});
