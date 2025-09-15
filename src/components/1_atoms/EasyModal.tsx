import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/components/lib/utils";

export const EasyDialog = ({
  children,
  button,
  title,
  titleClassName,
  className,
  description,
  descriptionClassName,
  open,
  setOpen,
}: {
  children: React.ReactNode;
  button: React.ReactNode;
  title?: React.ReactNode;
  titleClassName?: string;
  className?: string;
  description?: React.ReactNode;
  descriptionClassName?: string;
  open?: boolean;
  setOpen?: (value: boolean) => void;
}) => (
  <Dialog {...(open && setOpen && { open, setOpen })}>
    <DialogTrigger asChild>{button}</DialogTrigger>
    <DialogContent
      className={cn(className)}
      {...(open && setOpen && { onClick: () => setOpen(false) })}
      {...(!description && { ["aria-describedby"]: undefined })}
    >
      {(title || description) && (
        <DialogHeader>
          {title && (
            <DialogTitle className={cn(titleClassName)}>{title}</DialogTitle>
          )}
          {description && (
            <DialogDescription className={cn(descriptionClassName)}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
      )}
      {children}
    </DialogContent>
  </Dialog>
);
