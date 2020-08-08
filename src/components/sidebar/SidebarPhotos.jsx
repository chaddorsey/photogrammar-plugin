import React, { useState, useRef, useEffect } from 'react';
import { Async, useFetch } from 'react-async';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import he from 'he';
import { getStateAbbr } from '../../helpers.js';
import PhotoCard from './PhotoCard.js';
import './SidebarPhotos.css';

const loadPhotos = async ({ query }, { signal }) => {
  console.log('fetching query');
  const response = await fetch(query, { signal });
  if (!response.ok) { console.warn(`Error retrieving photos: ${response}`); }
  return response.json();
};

const formatPhotos = (data, offset, displayableCards) => {
  const sliceStart = Math.max(0, offset - displayableCards);
  const photosToGet = (offset === 0) ? displayableCards * 2 : displayableCards * 3
  const sliceEnd = sliceStart + photosToGet;
  // console.log(offset, displayableCards, sliceStart, sliceEnd);
  const rows = (data.rows) ? data.rows : data.slice(sliceStart, sliceEnd);
  return rows.map((sp, idx) => ({
    ...sp,
    caption: (sp.caption) ? he.decode(sp.caption) : '',
    stateAbbr: getStateAbbr(sp.state),
    idx: (sp.theoffset) ? sp.theoffset + idx : sliceStart + idx,
  }));
};

const SidebarPhotos = (props) => {
  const {
    query,
    getStateAbbr,
    sidebarPhotosOffset,
    photoSetId,
    displayableCards,
    sidebarWidth,
    blankCardWidth,
    blankCardHeight
  } = props;

  const sidebarPhotosRef = useRef();
  const prevPageRef = useRef();
  const currentPageRef = useRef();
  const nextPageRef = useRef();

  const currentOffset = useRef(props.sidebarPhotosOffset);

  let marginLeft = 0;
  if (currentOffset.current === sidebarPhotosOffset) {
    marginLeft = sidebarWidth * -1;
  }
  if (currentOffset.current < sidebarPhotosOffset) {
    marginLeft = 0;
  }
  if (currentOffset.current > sidebarPhotosOffset) {
    marginLeft = sidebarWidth * -2;
  }

  useEffect(() => {
    console.log('useEffect executing ', sidebarPhotosOffset);
    if (prevPageRef && prevPageRef.current) {
        console.log('useEffect executing');
        //const photoContainer = d3.select(sidebarPhotosRef.current);
        const prevPage = d3.select(prevPageRef.current);
        const currentPage = d3.select(currentPageRef.current);
        const nextPage = d3.select(nextPageRef.current);
        // correctly set the margin on the page to display the page that will be transitioned from
        //const currentMarginLeft = parseInt(sidebarPhotosRef.current.style.transform.match(/\d+/g));
        const currentMarginLeft = parseInt(currentPageRef.current.style.transform.match(/\d+/g));
        
        console.log(currentMarginLeft);
        // if (currentMarginLeft !== marginLeft) {
        //   console.log(currentMarginLeft, marginLeft);
        //   photoContainer
        //     .style('transform', `translateX(${marginLeft}px)`)
        //     //.style('margin-left', `${marginLeft}px`)
        // }
        // run the transition to position the middle photoSet in the viewable area
        let move = 0;
        if (currentOffset.current > sidebarPhotosOffset) {
          move = sidebarWidth;
        }
        if (currentOffset.current < sidebarPhotosOffset) {
          move = sidebarWidth * -1;
        }
        if (move !== 0) {
          prevPage
            .transition()
            .duration(1000)
            //.style('margin-left', `${-1 * sidebarWidth}px`)
            .style('transform', `translateX(${-1 * sidebarWidth}px)`);
          currentPage
            .transition()
            .duration(1000)
            //.style('margin-left', `${-1 * sidebarWidth}px`)
            .style('transform', `translateX(${0}px)`);
          nextPage
            .transition()
            .duration(1000)
            //.style('margin-left', `${-1 * sidebarWidth}px`)
            .style('transform', `translateX(${sidebarWidth}px)`)
            .on('end', () => {
              currentOffset.current = sidebarPhotosOffset;
            });
        } else {
          currentOffset.current = sidebarPhotosOffset;
        }
      }
      })

  const state = useFetch(query, {
    headers: { accept: "application/json" },
  });

  if (state.error) return state.error.message;
  if (state.data ) {
          const photos = formatPhotos(state.data, sidebarPhotosOffset, displayableCards);

          let movesTo = false;
          if (sidebarPhotosOffset > currentOffset.current) {
            movesTo = 'left';
          } else if (sidebarPhotosOffset < currentOffset.current) {
            movesTo = 'right';
          }
          // split into photoCard sets
          let prevPhotos = [];
          let currentPhotos = [];
          let nextPhotos = [];
          let currentPhotosIdx = photos[0].idx;
          if (photos.length <= displayableCards) {
            currentPhotos = photos;
          } else if (photos.length <= displayableCards * 2) {
            currentPhotos = photos.slice(0, displayableCards);
            nextPhotos = photos.slice(displayableCards, displayableCards * 2);
          } else {
            prevPhotos = photos.slice(0, displayableCards);
            currentPhotos = photos.slice(displayableCards, displayableCards * 2);
            nextPhotos = photos.slice(displayableCards * 2);
            currentPhotosIdx = photos[displayableCards].idx;
          }

          // calculate the five possible positions
          const getTranslateX = (offsetIdx) => {
            const farLeft = sidebarWidth * -2;
            const left = sidebarWidth * -1;
            const center = 0;
            const right = sidebarWidth;
            const farRight = sidebarWidth * 2;

            console.log(currentOffset.current, offsetIdx)
            if (offsetIdx === currentOffset.current) {
              return center;
            }
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
          }
          let translateX;
          if (!movesTo) {
            translateX = 0;
          } else if (movesTo === 'left') {
            translateX = sidebarWidth;
          } else {
            translateX = sidebarWidth * -1;
          }

          const photoSets = [
            {
              photos: prevPhotos,
              offset: currentPhotosIdx - displayableCards, 
              setId: photoSetId,
              ref: prevPageRef,
              translateX: getTranslateX(currentPhotosIdx - displayableCards),
            },
            {
              photos: currentPhotos,
              offset: currentPhotosIdx, 
              setId: photoSetId,
              ref: currentPageRef,
              translateX: getTranslateX(currentPhotosIdx),
            },
            {
              photos: nextPhotos,
              offset: currentPhotosIdx + displayableCards, 
              setId: photoSetId,
              ref: nextPageRef,
              translateX: getTranslateX(currentPhotosIdx + displayableCards),
            },
          ];
          console.log(photoSets);

          const blankCardsCount = [];
          // const blankCardsCount = (photoSets.length >= 1 && photoSets[photoSets.length - 1].photos)
          //   ? [...Array(Math.max(0, displayableCards - photoSets[photoSets.length - 1].photos.length)).keys()] : [];

          let currentX = 0;
          if (currentOffset.current < sidebarPhotosOffset) {
            currentX = sidebarWidth;
          } else if (currentOffset.current > sidebarPhotosOffset) {
            currentX = -1 * sidebarWidth;
          }

          console.log('ready to return', sidebarPhotosOffset);

    return (
      <div
        id="sidebar-photos"
        ref={sidebarPhotosRef}
      >
                {photoSets.map((ps, idx) => {
                  // const thePhotos = (ps.setId !== photoSet.setId || ps.offset !== photoSet.offset || !photoSet.photos)
                  //   ? photos : photoSet.photos;
                  return (
                    <div
                      className='photoPage'
                      key={`${ps.setId}-${ps.offset}`}
                      // this is necessary to be hardcoded at least in firefox as the flex spec requires a definitive width
                      // https://stackoverflow.com/questions/27472595/firefox-34-ignoring-max-width-for-flexbox
                      style={{
                        width: sidebarWidth,
                        transform: 'translateX(0)',
                        transform: `translateX(${ps.translateX}px)`,
                      }}
                      ref={ps.ref}
                    >
                      {ps.photos.map(photo => (
                        <PhotoCard
                          key={photo.loc_item_link}
                          photo={photo}
                          //notSelected={selectedPhotoCallNumber && selectedPhotoCallNumber !== photo.call_number}
                        />
                      ))}

                      {/* hacky--uggh--but fill in any blank spots at the end with 'empty cards' to maintain alignment  */}
                      {blankCardsCount.map(idx => (
                        <div 
                          className='blankCard' 
                          style={{
                            height: blankCardHeight,
                            width: blankCardWidth,
                          }}
                          key={`blankCard${idx}`}
                        />
                      ))}
                    </div>
                  )
                })}
      </div>
    );
        }  

  return null;
};

export default SidebarPhotos;

SidebarPhotos.propTypes = {

};

SidebarPhotos.defaultProps = {
};

