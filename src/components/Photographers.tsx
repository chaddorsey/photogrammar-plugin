import * as React from 'react';
import { Link } from "react-router-dom";
import OralHistoriesSearchForm from './OralHistoriesSearchForm';
import MicrophoneButton from './buttons/Microphone';
import './Photographers.css';
import { PhotographerMetadata } from '../index.d';
const Photographers = ({ photographersStaff, photographersNonstaff }: { photographersStaff: PhotographerMetadata[]; photographersNonstaff: PhotographerMetadata[] }) => {
  return (
    <div
      className='photographers'
    >
      <div className='explanation'>
        <p>
          Over 40 photographers contributed to the FSA-OWI collection.  Yet, hiring and keeping photographers was a difficult task. The financial and political instability of the New Deal meant that funding could disappear as quickly as it appeared. Resourceful and protective of his colleagues, director of the FSA Historical Section Roy Stryker went to great lengths to keep the unit operating. While thirteen people worked as staff photographers, and therefore on more stable and continuing employment, most photographers held short term contracts that were often renewed or took photographs while holding another position within the federal government. Over half of the photographers worked for more than a year with a smaller set of photographers employed over several years, many of whom are among the best known, such as <Link to='/photographers/DorotheaLange'>Dorothea Lange</Link> and <Link to='/photographers/ArthurRothstein'>Arthur Rothstein</Link>.</p>
        <p>
          The number of photographers and images resulted in a collection shaped by government mandates and expanded by individual photographers' interests and political commitments. Photographers received Stryker's instructions discussing particular topics to cover, such as farming, small towns, and war mobilization. Among the most prescriptive instructions were <a href='https://www.loc.gov/rr/print/coll/fsawr/fsawr.html#shooting' target='_blank'>shooting scripts</a>, which outlined in detail topics to capture such as <a href='https://www.loc.gov/rr/print/coll/fsawr/12024-26-Supp1503-D1-1p.pdf' target='_blank'>tobacco</a> , along with lists of particular types of actions such as "loading and hauling tobacco to market." The <Link to='/themes'>themes</Link> reflected Stryker’s interests and demands from patrons, including journalists, writers, and federal workers from other units. At the same time, Stryker recognized that letting the photographers pursue their interests would lead to a more robust, representative, and influential archive of the era. Therefore, photographers snapped away, following their own lines of sight as well as the needs of the federal government, a delicate balance that Stryker and many of the photographers expertly navigated.</p>
        <p>
          By selecting a photographer's name, you can explore the images that each photographer created and read a short biography. An oral interview with a transcript (those marked with a <MicrophoneButton />) is also provided for several photographers as well as staff members. The interviews are a part of an initiative from the <a href='https://www.aaa.si.edu/inside-the-archives/the-new-deal-and-the-arts' target='_blank'>Smithsonian Archives of American Art's New Deal and the Arts</a> project, which conducted oral histories with over 400 artist and art administors from 1963-1965. Using linked open data, the Library of Congress is centralizing bibliographic information through the <a href='http://id.loc.gov/authorities/names.html' target='_blank'>LOC Named Authority File</a>, which we have included in the bibliographies. The link leads to the Library of Congress where a list of additional related information about the person is being aggregated. For clarity, we refer to the unit as the “Historical Section” rather than the more common “FSA” because the photography unit moved from the Resettlement Administration (RA) to the Farm Security Administration (FSA) to the Office of War Information (OWI), which came with shifts in mission and hiring. See <Link to='/photographers/About'>About</Link> for more information about the history of the organization. As more information is available, the biographies will be updated. 
        </p>
      </div>
      <div className='photographersGroups'>
        <OralHistoriesSearchForm />
        <div className='photographerCards'>
          <Link
            to='/photographers/RoyStryker'
          >
            <figure
              className='photographerCard'
            >
              <img
                src={`${process.env.PUBLIC_URL}/static/photographerThumbnails/RoyStryker.jpg`}
              />
              <figcaption>
                <MicrophoneButton />
                Roy Stryker
                <br />
                Director of the FSA Photography Program
              </figcaption>
            </figure>
          </Link>
​
          <Link
            to='/photographers/AikenAndWool'
          >
            <figure
              className='photographerCard'
            >
              <img
                src={`${process.env.PUBLIC_URL}/static/photographerThumbnails/HelenWool.jpg`}
              />
              <figcaption>
                <MicrophoneButton />
                Charlotte Aiken, Accountant, and Helen Wool (pictured), Secretary, FSA
              </figcaption>
            </figure>
          </Link>

          <Link
            to='/photographers/CBBaldwin'
          >
            <figure
              className='photographerCard'
            >
              <img
                src={`${process.env.PUBLIC_URL}/static/photographerThumbnails/CBBaldwin.jpg`}
              />
              <figcaption>
                <MicrophoneButton />
                C. B. Baldwin
                <br />
                Administrator of the FSA
              </figcaption>
            </figure>
          </Link>
        </div>
        <h3>Staff Photographers</h3>
        <div className='photographerCards'>
          {photographersStaff.map(photographer => (
            <Link
              to={`/photographers/${photographer.key}`}
              key={`${photographer.key}`}
            >
              <figure
                className='photographerCard'
              >
                <img
                  src={`${process.env.PUBLIC_URL}/static/photographerThumbnails/${photographer.img}`}
                />
                <figcaption>
                  {(photographer.interview && photographer.interview.files && photographer.interview.files.length > 0) && (
                    <MicrophoneButton />

                  )}

                  {`${photographer.firstname} ${photographer.lastname}`}
                  {(photographer.count) && (
                    <div
                      className='count'
                    >
                      {`${photographer.count.toLocaleString()} photos`}
                    </div>
                  )}
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>

        <h3>Non-staff Photographers</h3>
        <div className='photographerCards'>
          {photographersNonstaff.map(photographer => (
            <Link
              to={`/photographers/${photographer.key}`}
              key={`${photographer.key}`}
            >
              <figure
                className='photographerCard'
              >
                <img
                  src={`${process.env.PUBLIC_URL}/static/photographerThumbnails/${photographer.img}`}
                />
                <figcaption>
                  {(photographer.interview && photographer.interview.files && photographer.interview.files.length > 0) && (
                    <MicrophoneButton />
                  )}

                  {`${photographer.firstname} ${photographer.lastname}`}
                  {(photographer.count) && (
                    <div
                      className='count'
                    >
                      {`${photographer.count.toLocaleString()} photos`}
                    </div>
                  )}
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Photographers;
