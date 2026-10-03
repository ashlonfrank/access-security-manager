import { useCallback, useLayoutEffect, useState } from "react";

// Keep the management controls and column header above the scrolling rows.
export default function useStickyRows() {
  const [table, setTable] = useState<HTMLDivElement | null>(null);
  const ref = useCallback((node: HTMLDivElement | null) => setTable(node), []);
  useLayoutEffect(() => {
    if (!table) return;
    const header = table.querySelector<HTMLElement>(".list-header, .company-list-header");
    const body = table.querySelector<HTMLElement>(".list-body");
    if (!header || !body) return;
    const main = table.closest("main");
    const heading = main?.querySelector<HTMLElement>(".management-heading");
    const section = table.closest("section");
    const toolbar = section?.querySelector<HTMLElement>(".toolbar");
    let frame = 0;
    function measure() {
      if (heading && toolbar && main && window.innerWidth > 700) {
        const toolbarStyle = getComputedStyle(toolbar);
        const toolbarTop = 32 + heading.getBoundingClientRect().height + parseFloat(toolbarStyle.marginTop);
        toolbar.style.setProperty("--toolbar-sticky-top", `${toolbarTop}px`);
        let headerTop = toolbarTop + toolbar.getBoundingClientRect().height + parseFloat(toolbarStyle.marginBottom);
        const filters = section?.querySelector<HTMLElement>(".filters");
        if (filters) {
          filters.style.setProperty("--filters-sticky-top", `${headerTop}px`);
          headerTop += filters.getBoundingClientRect().height + parseFloat(getComputedStyle(filters).marginBottom);
        }
        table!.style.setProperty("--table-sticky-top", `${headerTop}px`);
      } else table!.style.setProperty("--table-sticky-top", "32px");
      const overlap = Math.max(0, header!.getBoundingClientRect().bottom - body!.getBoundingClientRect().top);
      body!.style.setProperty("--rows-clip-top", `${overlap}px`);
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    measure();
    const observer = new ResizeObserver(schedule);
    observer.observe(table);
    observer.observe(header);
    observer.observe(body);
    if (main) observer.observe(main);
    if (heading) observer.observe(heading);
    if (toolbar) observer.observe(toolbar);
    const mutations = new MutationObserver(schedule);
    if (section) mutations.observe(section, { childList: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [table]);
  return ref;
}
