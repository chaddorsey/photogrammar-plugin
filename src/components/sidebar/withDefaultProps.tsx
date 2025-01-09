import React from 'react';

interface DefaultProps {
  label: string;
  link: string;
  className?: string;
  disabled?: boolean;
  viz?: string;
}

export const withDefaultProps = <P extends object>(
  WrappedComponent: React.ComponentType<P & DefaultProps>
) => {
  return function WithDefaultProps(props: Omit<P, keyof DefaultProps>) {
    const defaultProps: DefaultProps = {
      label: '',
      link: '',
      className: '',
      disabled: false,
      viz: undefined
    };

    return <WrappedComponent {...defaultProps} {...(props as P)} />;
  };
}; 