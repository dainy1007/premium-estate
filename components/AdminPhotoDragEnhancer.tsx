"use client";

import { useEffect } from "react";

export default function AdminPhotoDragEnhancer() {
  useEffect(() => {
    if (!window.location.pathname.includes("/admin/properties/") || !window.location.pathname.endsWith("/edit")) {
      return;
    }

    let draggingCard: HTMLElement | null = null;

    const findButton = (card: HTMLElement, label: string) =>
      Array.from(card.querySelectorAll<HTMLButtonElement>("button")).find(
        (button) => button.textContent?.trim() === label,
      );

    const enhanceCards = () => {
      const deleteButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).filter(
        (button) => button.textContent?.trim() === "삭제",
      );

      deleteButtons.forEach((deleteButton) => {
        const card = deleteButton.parentElement?.parentElement as HTMLElement | null;
        if (!card || card.dataset.adminPhotoDragReady === "1") return;

        const upButton = findButton(card, "↑");
        const downButton = findButton(card, "↓");
        const coverButton = findButton(card, "대표");
        if (!upButton || !downButton || !coverButton) return;

        card.dataset.adminPhotoDragReady = "1";
        card.dataset.adminPhotoCard = "1";
        card.draggable = true;
        card.title = "사진을 마우스로 끌어서 순서를 변경할 수 있습니다.";
        card.style.cursor = "grab";
        card.style.userSelect = "none";

        card.addEventListener("dragstart", (event) => {
          draggingCard = card;
          card.style.opacity = "0.55";
          card.style.cursor = "grabbing";
          event.dataTransfer?.setData("text/plain", "admin-photo-reorder");
          if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        });

        card.addEventListener("dragend", () => {
          card.style.opacity = "";
          card.style.cursor = "grab";
          draggingCard = null;
        });

        card.addEventListener("dragover", (event) => {
          if (!draggingCard || draggingCard === card) return;
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
          card.style.outline = "2px solid #C9A227";
          card.style.outlineOffset = "2px";
        });

        card.addEventListener("dragleave", () => {
          card.style.outline = "";
          card.style.outlineOffset = "";
        });

        card.addEventListener("drop", (event) => {
          event.preventDefault();
          card.style.outline = "";
          card.style.outlineOffset = "";
          if (!draggingCard || draggingCard === card) return;

          const grid = card.parentElement;
          if (!grid || draggingCard.parentElement !== grid) return;

          const cards = Array.from(grid.children).filter(
            (element): element is HTMLElement =>
              element instanceof HTMLElement && element.dataset.adminPhotoCard === "1",
          );
          const fromIndex = cards.indexOf(draggingCard);
          const toIndex = cards.indexOf(card);
          if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

          const direction = fromIndex < toIndex ? "↓" : "↑";
          const moveButton = findButton(draggingCard, direction);
          const moveCount = Math.abs(toIndex - fromIndex);
          if (!moveButton) return;

          for (let i = 0; i < moveCount; i += 1) {
            moveButton.click();
          }
        });
      });
    };

    enhanceCards();
    const observer = new MutationObserver(enhanceCards);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
