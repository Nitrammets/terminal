import type { ComponentPropsWithoutRef, ReactElement } from "react";
import { useEffect, useState } from "react";
interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  label: ReactElement
  loading?: boolean
  className?: string
  disabled?: boolean
  timeOut?: number
}

const Spinner = () => <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <style dangerouslySetInnerHTML={{
    __html: `
  .spinner_S1WN {
    animation: spinner_MGfb .8s linear infinite;
    animation-delay: -.8s
  }

  .spinner_Km9P {
    animation-delay: -.65s
  }

  .spinner_JApP {
    animation-delay: -.5s
  }

  @keyframes spinner_MGfb {

    93.75%,
    100% {
      opacity: .2
    }
  }
`}}></style>
  <circle className="spinner_S1WN" cx="4" cy="12" r="3" />
  <circle className="spinner_S1WN spinner_Km9P" cx="12" cy="12" r="3" />
  <circle className="spinner_S1WN spinner_JApP" cx="20" cy="12" r="3" />
</svg>;

export default function Button({ label, loading, className, timeOut, disabled, ...props }: ButtonProps) {
  const [seconds, setSeconds] = useState(parseInt(((timeOut - Date.now()) / 1000).toFixed(0)));

  useEffect(() => {
    setSeconds(parseInt(((timeOut - Date.now()) / 1000).toFixed(0)));
  }, [timeOut]);

  useEffect(() => {
    if (seconds > 0) {
      setTimeout(() => {
        setSeconds(seconds - 1);
      }, 1000);
    }
  }, [seconds])


  return <button disabled={loading || disabled || seconds > 0} className={`${className} flex items-center justify-center ${(loading || disabled || seconds > 0) && 'opacity-50 cursor-not-allowed'}`} {...props}>{loading ? <Spinner /> : seconds > 0 ? seconds + 's timeout' : label}</button>
}