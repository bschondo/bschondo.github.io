export class MotionProfile {
    constructor(
        public readonly minSpeed: number,
        public readonly maxSpeed: number,
        public readonly minSpeedDistance: number,
        public readonly maxSpeedDistance: number,
        public readonly gridResolution: number,
        public readonly maxCurveAngle: number
    ) {}

    public speedForDistance(distance: number): number {
        if (distance <= this.minSpeedDistance) {
            return this.minSpeed;
        } else if (distance >= this.maxSpeedDistance) {
            return this.maxSpeed;
        } else {
            // Linear interpolation between min and max speed based on distance
            const ratio = (distance - this.minSpeedDistance) / (this.maxSpeedDistance - this.minSpeedDistance);
            return this.minSpeed + ratio * (this.maxSpeed - this.minSpeed);
        }
    }
}