import { createSignal, For } from "solid-js"
import { SocialLoginButton } from "../SocialLoginButton"
import { cn } from "../../utils/common";


const SocialLoginList = () => {

  const loginMethods = () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

  const firstRow = loginMethods().slice(0, 3);
  const otherRow = loginMethods().slice(3);

  const [expand, setExpand] = createSignal(false)

  const handleExpand = () => {
    setExpand((prev) => !prev)
  }

  return (

    <div class="w3a--flex w3a--flex-col w3a--w-full w3a--gap-y-2">
      <SocialLoginButton />
      <div class="w3a--grid w3a--grid-cols-3 w3a--gap-x-2 w3a--gap-y-2">
        <For each={firstRow}>
          {(_) =>
            <SocialLoginButton showText={false} />
          }
        </For>
      </div>
      {/* 224px */}
      <div class={cn('w3a--grid w3a--grid-cols-3 w3a--gap-x-2 w3a--gap-y-2 w3a--overflow-hidden w3a--transition-all w3a--duration-700 w3a--ease-linear',
        { 'w3a--max-h-[192px]': expand(), 'w3a--max-h-0': !expand() })}>
        <For each={otherRow}>
          {(_) =>
            <SocialLoginButton showText={false} />
          }
        </For>
      </div>
      <p class="w3a--text-xs w3a--font-normal w3a--text-app-gray-500 w3a--text-start">We do not store any data related to your social logins.</p>
      <button type="button" class="w3a--text-xs w3a--font-normal w3a--text-app-primary-600 hover:w3a--text-app-primary-500 dark:w3a--text-app-primary-500 dark:hover:w3a--text-app-primary-600 w3a--text-right" onClick={handleExpand}>View More</button>
    </div>
  )
}

export default SocialLoginList