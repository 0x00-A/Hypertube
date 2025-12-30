import type { IMovie } from '../../types/movie.types';
import { SliderMovies } from './SliderMovies';
import { clsx } from 'clsx';

interface HeroSectionProps {
  sliderMovies: IMovie[];
  className?: string;
}

export const HeroSection = ({
  sliderMovies,
  className,
}: HeroSectionProps) => {
  return (
    <div className={clsx('w-full -mt-14 pt-14', className)}>
      <div className="h-[400px] md:h-[480px] lg:h-screen min-h-[550px]">
        <SliderMovies
          movies={sliderMovies}
          autoPlayInterval={5000}
          className="h-full"
        />
      </div>
    </div>
  );
};
