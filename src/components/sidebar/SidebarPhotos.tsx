import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { select } from 'd3-selection';
import { transition } from 'd3-transition';
// @ts-ignore
import he from 'he';
// @ts-ignore
import us from 'us';
import PhotoCard from './PhotoCard.js';
import './SidebarPhotos.css';
import { PhotoMetadata, StateAbbr } from '../../index.d';
import { Props, PhotoSet } from './SidebarPhotos.d';

// Initialize d3 transition
select.prototype.transition = transition;

const formatPhotos = (data: PhotoMetadata[], offset: number, displayableCards: number) => {
  const sliceStart = Math.max(0, offset - displayableCards);
  const photosToGet = (offset === 0) ? displayableCards * 2 : displayableCards * 3
  const sliceEnd = sliceStart + photosToGet;
  const rows = data.slice(sliceStart, sliceEnd);
  return rows.map((sp: PhotoMetadata, idx: number) => ({
    ...sp,
    caption: (sp.caption) ? he.decode(sp.caption) : '',
    stateAbbr: (sp.state && us.lookup(sp.state)) ? us.lookup(sp.state).abbr as StateAbbr : undefined,
    idx: sliceStart + idx,
  })) as PhotoMetadata[];
};

const SidebarPhotos = (props: Props) => {
  const {
    sidebarPhotosOffset,
    photoSetId,
    displayableCards,
    sidebarWidth,
    cardDimensions,
    selectedPhotograph,
    width,
    height,
    interiorWidth,
    ...otherProps
  } = props;

  const prevPageRef = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef<HTMLDivElement>(null);
  const nextPageRef = useRef<HTMLDivElement>(null);

  const currentOffset = useRef(sidebarPhotosOffset);
  const photos = useSelector((state: any) => state.sidebarPhotos) as PhotoMetadata[];

  useEffect(() => {
    if (prevPageRef.current && currentPageRef.current && nextPageRef.current) {
      // run the transition to position the middle photoSet in the viewable area
      if (currentOffset.current !== sidebarPhotosOffset) {
        select(prevPageRef.current)
          .transition()
          .duration(1000)
          .style('transform', `translateX(${-1 * sidebarWidth}px)`);
        select(currentPageRef.current)
          .transition()
          .duration(1000)
          .style('transform', `translateX(${0}px)`)
          .on('end', () => {
            currentOffset.current = sidebarPhotosOffset;
          });
        select(nextPageRef.current)
          .transition()
          .duration(1000)
          .style('transform', `translateX(${sidebarWidth}px)`);
      } 
    }
  }, [sidebarPhotosOffset, sidebarWidth]);

  if (!photos || photos.length === 0) {
    return (<h2 className='noPhotos'>no photos available</h2>);
  }

  const formattedPhotos = formatPhotos(photos, sidebarPhotosOffset, displayableCards);
  if (formattedPhotos.length === 0) {
    return (<h2 className='noPhotos'>no photos available</h2>);
  }

  const currentPhotosIdx = formattedPhotos[0]?.idx ?? 0;

  // calculate the five possible positions
  const getTranslateX = (offsetIdx: number): number => {
    const farLeft = sidebarWidth * -2;
    const left = sidebarWidth * -1;
    const center = 0;
    const right = sidebarWidth;
    const farRight = sidebarWidth * 2;

    if (offsetIdx < currentOffset.current) {
      if (Math.abs(offsetIdx - currentOffset.current) === displayableCards) {
        return left;
      }
      return farLeft;
    }
    if (offsetIdx > currentOffset.current) {
      if (Math.abs(offsetIdx - currentOffset.current) === displayableCards) {
        return right;
      }
      return farRight;
    }
    return center;
  }

  const calculateBlankCards = (numCards: number): string[] => 
    new Array(Math.max(0, displayableCards - numCards)).fill('');

  // assign the retrieved photos to the appropriate set and calculate the offset # of the current set
  let prevPhotos: PhotoMetadata[] = [];
  let currentPhotos: PhotoMetadata[] = [];
  let nextPhotos: PhotoMetadata[] = [];

  if (formattedPhotos.length <= displayableCards) {
    currentPhotos = formattedPhotos;
  } else if (formattedPhotos.length <= displayableCards * 2) {
    if (sidebarPhotosOffset > currentOffset.current) {
      prevPhotos = formattedPhotos.slice(0, displayableCards);
      currentPhotos = formattedPhotos.slice(displayableCards);
    } else {
      currentPhotos = formattedPhotos.slice(0, displayableCards);
      nextPhotos = formattedPhotos.slice(displayableCards);
    }
  } else {
    prevPhotos = formattedPhotos.slice(0, displayableCards);
    currentPhotos = formattedPhotos.slice(displayableCards, displayableCards * 2);
    nextPhotos = formattedPhotos.slice(displayableCards * 2);
  }

  const photoSets: PhotoSet[] = [
    {
      photos: prevPhotos,
      blankCards: calculateBlankCards(prevPhotos.length),
      translateX: getTranslateX(currentPhotosIdx - displayableCards),
      offset: currentPhotosIdx - displayableCards, 
      ref: prevPageRef,
    },
    {
      photos: currentPhotos,
      blankCards: calculateBlankCards(currentPhotos.length),
      translateX: getTranslateX(currentPhotosIdx),
      offset: currentPhotosIdx, 
      ref: currentPageRef,
    },
    {
      photos: nextPhotos,
      blankCards: calculateBlankCards(nextPhotos.length),
      translateX: getTranslateX(currentPhotosIdx + displayableCards),
      offset: currentPhotosIdx + displayableCards, 
      ref: nextPageRef,
    },
  ];

  return (
    <div id="sidebar-photos">
      {photoSets.map((ps) => (
        <div
          className='photoPage'
          style={{
            width: sidebarWidth,
            transform: `translateX(${ps.translateX}px)`,
          }}
          ref={ps.ref}
          key={`${photoSetId}-${ps.offset}`}
        >
          {ps.photos.map((photo: PhotoMetadata) => (
            <PhotoCard
              selectedPhotograph={selectedPhotograph}
              width={width}
              height={height}
              interiorWidth={interiorWidth}
              {...otherProps}
              photo={photo}
              key={photo.loc_item_link}
            />
          ))}

          {ps.blankCards.map((blank: string, idx: number) => (
            <div 
              className='blankCard' 
              style={{
                height: cardDimensions.height,
                width: cardDimensions.width,
              }}
              key={`blankCard${idx.toString()}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SidebarPhotos;
