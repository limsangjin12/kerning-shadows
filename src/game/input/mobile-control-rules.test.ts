import { describe, expect, it } from "vitest";
import {
  clampMobileJoystickOffset,
  mobileJoystickDirections,
} from "./mobile-control-rules";

describe("mobile control rules", () => {
  it("keeps small joystick movement inside the dead zone", () => {
    expect(mobileJoystickDirections(10, 10, 100, 100)).toEqual({
      left: false,
      right: false,
      down: false,
    });
  });

  it("maps horizontal movement and a downward jump modifier", () => {
    expect(mobileJoystickDirections(-60, 0, 100, 100)).toEqual({
      left: true,
      right: false,
      down: false,
    });
    expect(mobileJoystickDirections(60, 60, 100, 100)).toEqual({
      left: false,
      right: true,
      down: true,
    });
  });

  it("clamps the knob horizontally and only toward the bottom", () => {
    expect(clampMobileJoystickOffset(30, 20, 100, 40)).toEqual({
      x: 30,
      y: 20,
    });
    expect(clampMobileJoystickOffset(300, 80, 100, 40)).toEqual({
      x: 100,
      y: 40,
    });
    expect(clampMobileJoystickOffset(-300, -80, 100, 40)).toEqual({
      x: -100,
      y: 0,
    });
    expect(clampMobileJoystickOffset(Number.NaN, 0, 100, 40)).toEqual({
      x: 0,
      y: 0,
    });
  });
});
