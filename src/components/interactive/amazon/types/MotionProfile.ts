export interface MotionProfile {
    minSpeed: number;
    maxSpeed: number;
    minSpeedDistance: number;
    maxSpeedDistance: number;
    gridResolution: number;
}

export function speedForDistance(profile: MotionProfile, distance: number): number {
    if (distance <= profile.minSpeedDistance) {
        return profile.minSpeed;
    } else if (distance >= profile.maxSpeedDistance) {
        return profile.maxSpeed;
    } else {
        const ratio = (distance - profile.minSpeedDistance) / (profile.maxSpeedDistance - profile.minSpeedDistance);
        return profile.minSpeed + ratio * (profile.maxSpeed - profile.minSpeed);
    }
}