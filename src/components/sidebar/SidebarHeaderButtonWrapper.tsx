import React from 'react';
import { connect } from 'react-redux';

interface WrapperProps {
  children: React.ReactElement;
  label?: string;
  link?: string;
  className?: string;
  disabled?: boolean;
  viz?: string;
}

const SidebarHeaderButtonWrapper: React.FC<WrapperProps> = ({ children }) => {
  return React.cloneElement(children, {
    label: '',
    link: '',
    className: '',
    disabled: false,
    viz: undefined
  });
};

const mapStateToProps = () => ({});

export default connect(mapStateToProps)(SidebarHeaderButtonWrapper); 