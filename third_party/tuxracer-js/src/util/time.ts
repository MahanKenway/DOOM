export namespace Time {
  export const ONE_MINUTE_IN_MILLISECONDS = 60 * 1000;
  export const ONE_SECOND_IN_MILLISECONDS = 1000;
  export const ONE_DECISECOND_IN_MILLISECONDS = 10;

  export function getSeconds(): number {
    return Date.now() / ONE_SECOND_IN_MILLISECONDS;
  }
}
