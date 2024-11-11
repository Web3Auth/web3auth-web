import { createSignal, type Component } from "solid-js";
import { Modal } from "./components/Modal";
import { Body } from "./components/Body";

const App: Component = () => {
  const [open, setOpen] = createSignal(false);
  return (
    <div class="w3a--w-screen w3a--h-screen w3a--flex w3a--items-center w3a--justify-center w3a--flex-col w3a--gap-4">
      <h1 class="w3a--text-3xl w3a--font-bold w3a--text-slate-700">Try out your new modal</h1>
      <button onClick={() => setOpen(true)}>Open Modal</button>
      <Modal open={open()} onClose={() => setOpen(false)} placement="center" padding={false} showCloseIcon>
        <Body />
      </Modal>
    </div>
  );
};

export default App;
