import { createSignal, type Component } from "solid-js";
import { Modal } from "./components/Modal";
import { Body } from "./components/Body";

const App: Component = () => {
  const [open, setOpen] = createSignal(false);
  return (
    <div class="w-screen h-screen flex items-center justify-center flex-col gap-4">
      <h1 class="text-3xl font-bold text-slate-700">Try out your new modal</h1>
      <button onClick={() => setOpen(true)}>Open Modal</button>
      <Modal open={open()} onClose={() => setOpen(false)} placement="center" padding={false} showCloseIcon>
        <Body />
      </Modal>
    </div>
  );
};

export default App;
