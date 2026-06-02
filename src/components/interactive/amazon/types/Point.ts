export interface Point {
  x: number;
  y: number;
}

export function updatePointAndClamp(point: Point, dimensions: { width: number; height: number }): Point {
    return {
        x: Math.max(0, Math.min(point.x, dimensions.width)),
        y: Math.max(0, Math.min(point.y, dimensions.height))
    };
}

export function newClampedPoint(x: number, y: number, dimensions: { width: number; height: number }): Point {
    return {
        x: Math.max(0, Math.min(x, dimensions.width)),
        y: Math.max(0, Math.min(y, dimensions.height))
    };
}