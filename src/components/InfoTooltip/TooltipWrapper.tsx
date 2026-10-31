import React, { FC, ReactNode } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import getUniqueId from "../../utils/getUniqueId";

interface TooltipWrapperProps {
  content: string | ReactNode;
  placement?: string;
  className?: string;
}

const TooltipWrapper: FC<TooltipWrapperProps> = ({
  content,
  placement,
  children,
  className,
}: any) => {
  if (content) {
    const id = getUniqueId("tooltip");

    return (
      <OverlayTrigger
        key={id}
        placement={placement || "top"}
        delay={100}
        overlay={
          <Tooltip id={id} className={className}>
            <>{content}</>
          </Tooltip>
        }
      >
        {children}
      </OverlayTrigger>
    );
  }
  return <>{children}</>;
};

export default TooltipWrapper;
