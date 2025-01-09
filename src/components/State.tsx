import React from 'react';
import { Link } from 'react-router-dom';

interface Props {
  d: string;
  abbr: string;
  name: string;
  labelCoords: [number, number];
  bounds: number[][];
  fillOpacity: number;
  link: string;
  linkActive: boolean;
  scale: number;
  onHover: (abbr: string) => void;
  onUnhover: () => void;
}

const State = ({
  d,
  abbr,
  fillOpacity,
  link,
  linkActive,
  scale,
  onHover,
  onUnhover,
}: Props) => {
  const path = (
    <path
      d={d}
      fill='#eceff1'
      fillOpacity={fillOpacity}
      stroke='#263238'
      strokeWidth={0.75 / scale}
      onMouseEnter={() => onHover(abbr)}
      onMouseLeave={onUnhover}
    />
  );

  if (linkActive) {
    return (
      <Link to={link}>
        {path}
      </Link>
    );
  }

  return path;
};

export default State;
