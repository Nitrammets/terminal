export const truncate = (num: number, places: number, toString?:boolean ) =>  {
  return !toString ? (Math.trunc(num * Math.pow(10, places)) / Math.pow(10, places)).toFixed(places) : (Math.trunc(num * Math.pow(10, places)) / Math.pow(10, places));
} 