import React from 'react';
import Async from "react-async";
import { Link } from "react-router-dom";
// @ts-ignore
import he from 'he';
// @ts-ignore
import us from 'us';
import SimilarPhotoCard from './sidebar/PhotoCardSimilar.js';
import CloseButton from './buttons/Close';
import ExpandButton from './buttons/Expand';
import States from '../data/svgs/states.json';
import './Photo.css';
import { getCentroidForCounty } from '../helpers.js';
import { PhotoMetadata } from '../index.d';
import { Props } from './Photo.d';

const loadPhotoData = async ({ photoMetadataQuery, similarPhotosQuery }: { photoMetadataQuery: string, similarPhotosQuery: string}) => {
  const responses = await Promise.all([
    fetch(photoMetadataQuery),
    fetch(similarPhotosQuery)
  ]);
  if (responses.some(res => !res.ok)) { console.warn(responses) }
  const dbDataPhoto: { rows: PhotoMetadata[] } = await responses[0].json();
  const photoMetadata: PhotoMetadata = dbDataPhoto.rows[0];
  const dbDataSimilarPhotos: { rows: PhotoMetadata[] } = await responses[1].json();
  // if the photo is part of a strip, retrieve those photos
  if (photoMetadata.photograph_type) {
    const stripQuery = `select * from photogrammar_photos where call_number = '${photoMetadata.call_number}' and photograph_type != 'ZC' order by photograph_type`;
    const responseStripPhotos = await fetch(`https://digitalscholarshiplab.cartodb.com/api/v2/sql?format=JSON&q=${encodeURIComponent(stripQuery)}`);
    if (!responseStripPhotos.ok) {
      console.warn(responseStripPhotos);
    }
    const stripPhotosJSON: { rows: PhotoMetadata[] } = await responseStripPhotos.json();
    if (stripPhotosJSON.rows.length > 0) {
      // there are two codes: `M${num}` or ABCDE
      photoMetadata.stripPhotos = stripPhotosJSON.rows.map(sp => ({
        ...sp,
        idx: (sp.photograph_type.length === 1) ? sp.photograph_type.toLowerCase().charCodeAt(0) - 96 : parseInt(sp.photograph_type.substring(1)),
      }));
    }
  }
  return {
    photoMetadata: dbDataPhoto.rows[0],
    similarPhotos: dbDataSimilarPhotos.rows,
  };
}

const Photo = (props: Props) => {
  const {
    photoMetadataQuery,
    similarPhotosQuery,
    selectedMapView,
    height,
    lightboxLink,
    makeLink,
  } = props;

  return (
    <Async
      promiseFn={loadPhotoData}
      photoMetadataQuery={photoMetadataQuery}
      similarPhotosQuery={similarPhotosQuery}
      watch={photoMetadataQuery}
    >
      {({ data, error, isPending }) => {
        //if (isPending) return "Loading...";
        if (error) return `Something went wrong: ${error.message}`;
        if (data) {
          const { photoMetadata, similarPhotos } = data;
          photoMetadata.caption = (photoMetadata.caption) ? he.decode(photoMetadata.caption) : '';
          photoMetadata.stateAbbr = (photoMetadata.state) ? us.lookup(photoMetadata.state).abbr : '';
          photoMetadata.similarPhotos = similarPhotos.map(sp => ({
            ...sp,
            caption: (sp.caption) ? he.decode(sp.caption) : '',
            stateAbbr: (sp.state) ? us.lookup(sp.state).abbr : '',
          }));

          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

          const {
            loc_item_link,
            photographer_name,
            caption,
            year,
            month,
            city,
            county,
            state,
            stateAbbr,
            nhgis_join,
            vanderbilt_level1,
            vanderbilt_level2,
            vanderbilt_level3,
            call_number,
            // longitude,
            // latitude,
            img_large_path,
            stripPhotos,
          } = photoMetadata;
          const photographerKey = (photographer_name) ? photographer_name.replace(/[\s\.]/g, '') : null;
          const centroid = getCentroidForCounty(nhgis_join);

          const captionLines: string[] = [];
          if (caption) {
            captionLines.push(`"${caption}"`);
          }
          const linePieces: string[] = [];
          if (photographer_name) {
            linePieces.push(photographer_name);
          }
          if (month && year) {
            linePieces.push(`${monthNames[month]}, ${year}`);
          } else if (year) {
            linePieces.push(year.toString());
          }
          if (city && state) {
            linePieces.push(`${city}, ${stateAbbr}`);
          } else if (county && stateAbbr) {
            linePieces.push(`${county}, ${stateAbbr}`);
          } else if (stateAbbr) {
            linePieces.push(stateAbbr);
          }
          if (linePieces.length > 0) {
            captionLines.push(linePieces.join('; '));
          }

          let date = 'N/A';
          if (month && year) {
            date = `${monthNames[month]} ${year}`;
          } else if (year) {
            date = year.toString();
          }

          // calculate some strip stats
          const stripLength: number = (stripPhotos && stripPhotos.length > 1) ? stripPhotos[stripPhotos.length -1].idx : null;
          const stripNums: number[] = (stripPhotos && stripPhotos.length > 1) ? (new Array<number>(stripLength)).fill(0).map((d: number, idx: number): number => idx + 1) : [];
          const selectedPhotoStripNum: number = (stripPhotos && stripPhotos.length > 1) ? stripPhotos.find((sp: PhotoMetadata) => sp.loc_item_link === loc_item_link).idx : null;

          const closeLink = makeLink([{ type: 'set_clear_photo'}]);

          const photographerLink = (photographerKey) ? makeLink([{
            type: 'set_photographer',
            payload: photographerKey,
          }]) : null;
          const vl1Link = (vanderbilt_level1) ? makeLink([{
            type: 'set_theme',
            payload: encodeURI(`root|${vanderbilt_level1}`),
          }]) : null;
          const vl2Link = (vanderbilt_level2) ? makeLink([{
            type: 'set_theme',
            payload: encodeURI(`root|${vanderbilt_level1}|${vanderbilt_level2}`),
          }]) : null;
          const vl3Link = (vanderbilt_level3) ? makeLink([{
            type: 'set_theme',
            payload: encodeURI(`root|${vanderbilt_level1}|${vanderbilt_level2}|${vanderbilt_level3}`),
          }]) : null;
          const placeLink = (nhgis_join || city) ?  makeLink([{
            type: (selectedMapView === 'counties') ? 'set_county' : 'set_city',
            payload: (selectedMapView === 'counties') ? nhgis_join : city,
          }]) : null;

          return (
            <div
              className="selectedPhoto"
              style={{
                maxHeight: height,
              }}
            >
              <div className='close'>
                <Link to={closeLink}>
                  <CloseButton />
                </Link>
              </div>
              <div className="metadata">
                <h5>Caption (Original Description)</h5>
                <div className="metadatum">
                  {caption}
                </div>

                <h5>Photographer</h5>
                {(photographerLink) ? (
                  <Link
                    to={photographerLink}
                  >
                    <button>
                      {photographer_name}
                    </button>
                  </Link>
                ) : (
                  <div
                    className="metadatum"
                  >
                    {photographer_name}
                  </div>
                )}

                <h5>Created</h5>
                <div className="metadatum">
                  {date}
                </div>

                {(vanderbilt_level3) && (
                  <React.Fragment>
                    <h5>Themes (Original Tagging System)</h5>
                    <div className='tags'>
                      <Link to={vl1Link}>
                        {vanderbilt_level1}
                      </Link>
                      <Link to={vl2Link}>
                        {vanderbilt_level2}
                      </Link>
                      <Link to={vl3Link}>
                        {vanderbilt_level3}
                      </Link>
                    </div>
                  </React.Fragment>
                )}

                <h5>Location</h5>
                <div className="metadatum">
                  {((city || county) && state && centroid && centroid.center && centroid.center[0]) ? (
                    <Link to={placeLink}>
                      <button>
                        {(state === 'District of Columbia') ? 'Washington, DC' : `${county || city}, ${state}`}
                      </button>
                    </Link>
                  ) : (
                    <span>location unspecified</span>
                  )}
                </div>

                {((city || county) && state && centroid && centroid.center && centroid.center[0]) && (
                  <svg
                    width={300}
                    height={500 * 300 / 960}
                    className='map'
                  >
                    <g transform={`translate(0 ${-300 * 500 / 960 / 2.1}) scale(0.3)`}>
                      {States.filter(s => s.bounds && s.bounds[0] && s.d && s.abbr).map(state => (
                        <path
                          d={state.d}
                          fill='grey'
                          stroke='#999'
                          key={state.abbr}
                        />
                      ))}
                      {(centroid.center && centroid.center[0]) && (
                        <circle
                          cx={300 * centroid.center[0] / 1000 / 0.3}
                          cy={300 * centroid.center[1] / 1000 / 0.3}
                          //cy={centroid.center[1] / 1000 * (500 * 300 / 960)}
                          r={12}
                          fill='lime'
                        />
                      )}
                    </g>
                  </svg>
                )}

                {(call_number) && (
                  <React.Fragment>
                    <h5>Library of Congress Call Number</h5>
                    <div className="metadatum">
                      <a href={`http://www.loc.gov/pictures/item/${loc_item_link}`} target='_blank'>
                        {call_number}
                      </a>
                    </div>
                  </React.Fragment>
                )}
              </div>
              <div 
                className="img"

              >
                <Link to={lightboxLink}>
                  <img 
                    src={`//s3.amazonaws.com/dsl-general/photogrammar/${img_large_path}`}
                    className='full'
                    alt=""
                  />
                </Link>
              </div>

              <div
                className='relatedImages'
              >

                {(stripPhotos && stripPhotos.length > 1) && (
                  <React.Fragment>
                    <h5>
                      {`Part of a strip (${selectedPhotoStripNum} of ${stripLength})`}
                    </h5>
                    <div className='strip'>
                      {stripNums.map((num: number) => {
                        const stripPhoto = stripPhotos.find(sp => sp.idx === num);
                        if (stripPhoto) {
                          return (
                            <Link 
                              to={`/photo/${stripPhoto.loc_item_link}`}
                              key={`stripPhoto${stripPhoto.loc_item_link}`}
                            >
                              <div
                                className={(num === selectedPhotoStripNum) ? 'stripPhoto selected' : 'stripPhoto'}
                                style={{
                                  backgroundImage: `url('//s3.amazonaws.com/dsl-general/photogrammar/${stripPhoto.img_thumb_img}')`,
                                }}
                              >
                                <img src={`//s3.amazonaws.com/dsl-general/photogrammar/${stripPhoto.img_thumb_img}`} />
                              </div>
                            </Link>
                          );
                        }
                        return <div className='missing' key={`missing-${num}`} />;
                      })}
                    </div>
                  </React.Fragment>
                )}

                {(photoMetadata.similarPhotos.length > 0) && (
                  <React.Fragment>
                    <h2 className='similarPhotosHeader'>Similar Photos</h2>
                    <div className='similarPhotos'>
                      <div className='cards'>
                        {photoMetadata.similarPhotos.map(sp => (
                          <SimilarPhotoCard
                            photo={sp}
                            key={sp.loc_item_link}
                          />
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                )}  
              </div>

              <ExpandButton
                link={lightboxLink}
                role='expand'
                className=''
              />
            </div>
          );
        }
      }}
    </Async>
  );
};

export default Photo;
