import { Ref } from "vue";
export function watchWindowClick(ref: HTMLElement, cb: () => void) {
  document.addEventListener("click", (e: MouseEvent) => {
    if (!ref?.contains(e.target as HTMLElement)) {
      cb();
    }
  });
}
