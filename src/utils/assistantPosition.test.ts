import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOBILE_BOTTOM_NAV_CLEARANCE_PX,
  ORB_SIZE_PX,
  TOP_HEADER_CLEARANCE_PX,
  clampOrbPosition,
  computeChatPanelBox,
  getDefaultOrbPosition,
  isPointerDrag,
} from './assistantPosition';

test('clampOrbPosition keeps round AI orb inside desktop and mobile safe bounds', () => {
  const desktop = { width: 1440, height: 900 };
  const clampedTopLeft = clampOrbPosition({ x: -50, y: 10 }, desktop);
  assert.equal(clampedTopLeft.x, 16);
  assert.equal(clampedTopLeft.y, TOP_HEADER_CLEARANCE_PX);

  const mobile = { width: 390, height: 844 };
  const clampedBottomRight = clampOrbPosition({ x: 999, y: 999 }, mobile);
  assert.equal(clampedBottomRight.x, 390 - ORB_SIZE_PX - 16);
  assert.equal(clampedBottomRight.y, 844 - ORB_SIZE_PX - MOBILE_BOTTOM_NAV_CLEARANCE_PX);
});

test('isPointerDrag distinguishes intentional drags from taps/clicks', () => {
  assert.equal(isPointerDrag({ x: 100, y: 100 }, { x: 103, y: 102 }), false);
  assert.equal(isPointerDrag({ x: 100, y: 100 }, { x: 120, y: 100 }), true);
});

test('computeChatPanelBox keeps open chat panel within viewport when orb is moved to any corner', () => {
  const mobile = { width: 390, height: 844 };

  // Orb dragged to top-left corner
  const topLeftBox = computeChatPanelBox({ x: 16, y: 70 }, mobile);
  assert.ok(topLeftBox.left >= 12);
  assert.ok(topLeftBox.left + topLeftBox.width <= mobile.width - 12);
  assert.ok(topLeftBox.top >= TOP_HEADER_CLEARANCE_PX);

  // Orb in default bottom-right position
  const defOrb = getDefaultOrbPosition(mobile);
  const bottomRightBox = computeChatPanelBox(defOrb, mobile);
  assert.ok(bottomRightBox.left >= 12);
  assert.ok(bottomRightBox.left + bottomRightBox.width <= mobile.width - 12);
  assert.ok(bottomRightBox.top + bottomRightBox.maxHeight <= mobile.height - 60);
});
