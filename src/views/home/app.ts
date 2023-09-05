let count = 0;

const label = document.querySelector(".counter__label");
const trigger = document.querySelector(".counter__trigger");

if (trigger && label) {
  trigger.addEventListener("click", () => {
    label.textContent = (++count).toString();
  });
}
