import React, { useState, useRef, useEffect } from 'react';
import { select } from 'd3-selection';
import { transition } from 'd3-transition';
import type { Selection } from 'd3-selection';
import type { Transition } from 'd3-transition';
import { Link } from "react-router-dom";
import { StyledCity } from '../index.d';

// Initialize d3 transition
transition();

interface Props extends StyledCity {
  linkActive: boolean;
  makeLink(actions: { type: string, payload: string}[]): string;
  onCityHover(arg0: string): void;
  onCityUnhover(): void;
}

const City = (props: Props) => {
  const {
    id,
    cx,
    cy,
    fillOpacity,
    stroke,
    name,
    linkActive,
    makeLink,
    onCityHover,
    onCityUnhover,
  } = props;

  const ref = useRef<SVGCircleElement>(null);
  const isInitialMount = useRef(true);
  const transitionRef = useRef<Transition<SVGCircleElement, unknown, null, undefined> | null>(null);

  const [r, setR] = useState(props.r);
  const [strokeWidth, setStrokeWidth] = useState(props.strokeWidth);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Clean up previous transition if it exists
    if (transitionRef.current) {
      try {
        transitionRef.current.on("end", null);
      } catch (e) {
        // Ignore errors from interrupted transitions
      }
    }

    const element = ref.current && select<SVGCircleElement, unknown>(ref.current);
    if (!element) return;

    if (props.r === 0) {
      element
        .attr("r", props.r)
        .style("stroke-width", props.strokeWidth);
      setR(props.r);
      setStrokeWidth(props.strokeWidth);
    } else {
      const newTransition = element
        .transition()
        .duration(1000)
        .attr("r", props.r)
        .style("stroke-width", props.strokeWidth);

      newTransition.on("end", () => {
        if (ref.current) { // Only update state if component is still mounted
          setR(props.r);
          setStrokeWidth(props.strokeWidth);
        }
      });

      transitionRef.current = newTransition;
    }

    return () => {
      if (transitionRef.current) {
        try {
          transitionRef.current.on("end", null);
        } catch (e) {
          // Ignore errors from interrupted transitions
        }
      }
    };
  }, [props.r, props.strokeWidth]);

  const onHover = () => {
    onCityHover(id);
  }

  const onUnhover = () => {
    onCityUnhover();
  }

  const link = makeLink([{
    type: 'set_city',
    payload: id,
  }]);

  return (
    <Link
      to={`/city/${id}`}
      onClick={(!linkActive) ? e => e.preventDefault() : () => {}}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill='#289261'
        stroke={stroke}
        fillOpacity={fillOpacity}
        style={{
          strokeWidth,
        }}
        onMouseEnter={() => { onCityHover(id) }}
        onMouseLeave={onUnhover}
        ref={ref}
      />
    </Link>
  );
};

export default City;
