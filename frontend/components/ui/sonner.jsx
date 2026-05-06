"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      position={"top-right"}
      expand={true}
      visibleToasts={4}
      closeButton
      toastOptions={{
        classNames: {
          toast: "editorial-toast",
          title: "editorial-toast-title",
          description: "editorial-toast-description",
          icon: "editorial-toast-icon",
          actionButton: "editorial-toast-action",
          cancelButton: "editorial-toast-cancel",
          success: "editorial-toast-success",
          error: "editorial-toast-error",
          warning: "editorial-toast-warning",
          info: "editorial-toast-info",
          loading: "editorial-toast-loading",
          closeButton: "editorial-toast-close",
        },
      }}
      className={"toaster group"}
      icons={{
        success: <CircleCheckIcon className={"size-4"} />,
        info: <InfoIcon className={"size-4"} />,
        warning: <TriangleAlertIcon className={"size-4"} />,
        error: <OctagonXIcon className={"size-4"} />,
        loading: <Loader2Icon className={"size-4 animate-spin"} />,
      }}
      style={
        {
          "--normal-bg": "rgba(255,255,255,0.88)",
          "--normal-text": "#111111",
          "--normal-border": "rgba(17,17,17,0.08)",
          "--border-radius": "24px"
        }
      }
      {...props} />
  );
}

export { Toaster }
