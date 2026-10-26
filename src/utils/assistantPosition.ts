export const ORB_SIZE_PX = 56;
export const EDGE_MARGIN_PX = 16;
export const TOP_HEADER_CLEARANCE_PX = 64;
export const MOBILE_BOTTOM_NAV_CLEARANCE_PX = 72;

export interface Point2D {
  x: number;
  y: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ChatPanelBox {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

export function clampOrbPosition(pos: Point2D, viewport: ViewportSize): Point2D {
  const isMobile = viewport.width < 768;
  const minX = EDGE_MARGIN_PX;
  const maxX = Math.max(minX, viewport.width - ORB_SIZE_PX - EDGE_MARGIN_PX);

  const minY = TOP_HEADER_CLEARANCE_PX;
  const bottomClearance = isMobile ? MOBILE_BOTTOM_NAV_CLEARANCE_PX : EDGE_MARGIN_PX;
  const maxY = Math.max(minY, viewport.height - ORB_SIZE_PX - bottomClearance);

  return {
    x: Math.round(Math.min(maxX, Math.max(minX, pos.x))),
    y: Math.round(Math.min(maxY, Math.max(minY, pos.y))),
  };
}

export function getDefaultOrbPosition(viewport: ViewportSize): Point2D {
  const isMobile = viewport.width < 768;
  return clampOrbPosition(
    {
      x: viewport.width - ORB_SIZE_PX - 20,
      y: viewport.height - ORB_SIZE_PX - (isMobile ? 76 : 24),
    },
    viewport
  );
}

export function isPointerDrag(
  start: Point2D,
  current: Point2D,
  thresholdPx: number = 6
): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) > thresholdPx;
}

export function computeChatPanelBox(
  orbPos: Point2D,
  viewport: ViewportSize
): ChatPanelBox {
  const isMobile = viewport.width < 768;
  const horizontalMargin = 12;
  const panelWidth = Math.min(368, Math.max(280, viewport.width - horizontalMargin * 2));
  const bottomLimit = viewport.height - (isMobile ? MOBILE_BOTTOM_NAV_CLEARANCE_PX : 16);
  const availableVertical = Math.max(260, bottomLimit - TOP_HEADER_CLEARANCE_PX - 12);
  const maxHeight = Math.min(isMobile ? 460 : 510, availableVertical);

  // Align horizontally near orb center, clamped strictly inside viewport
  const idealLeft = orbPos.x + ORB_SIZE_PX - panelWidth;
  const left = Math.round(
    Math.min(
      viewport.width - panelWidth - horizontalMargin,
      Math.max(horizontalMargin, idealLeft)
    )
  );

  // Open above the orb when orb is in lower half; open below when dragged to upper half
  const openAbove = orbPos.y > viewport.height * 0.5;
  let top: number;
  if (openAbove) {
    top = Math.max(TOP_HEADER_CLEARANCE_PX + 4, orbPos.y - maxHeight - 12);
  } else {
    top = Math.min(bottomLimit - maxHeight, orbPos.y + ORB_SIZE_PX + 12);
    top = Math.max(TOP_HEADER_CLEARANCE_PX + 4, top);
  }

  return {
    left,
    top: Math.round(top),
    width: panelWidth,
    maxHeight: Math.round(maxHeight),
  };
}
