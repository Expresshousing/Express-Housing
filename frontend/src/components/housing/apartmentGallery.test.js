import { adjacentImageIndex, swipeDirection } from "./apartmentGalleryUtils";

describe("apartment gallery navigation", () => {
  test("stays on the only image in a single-image gallery", () => {
    expect(adjacentImageIndex(0, 1, 1)).toBe(0);
    expect(adjacentImageIndex(0, -1, 1)).toBe(0);
  });

  test("moves through multiple images and wraps at either end", () => {
    expect(adjacentImageIndex(2, 1, 4)).toBe(3);
    expect(adjacentImageIndex(3, 1, 4)).toBe(0);
    expect(adjacentImageIndex(0, -1, 4)).toBe(3);
  });

  test("recognizes deliberate horizontal swipes only", () => {
    expect(swipeDirection({ x: 180, y: 100 }, { x: 90, y: 108 })).toBe(1);
    expect(swipeDirection({ x: 90, y: 100 }, { x: 180, y: 108 })).toBe(-1);
    expect(swipeDirection({ x: 100, y: 100 }, { x: 75, y: 105 })).toBe(0);
    expect(swipeDirection({ x: 100, y: 100 }, { x: 40, y: 190 })).toBe(0);
  });
});
