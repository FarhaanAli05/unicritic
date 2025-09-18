'use client';

import Container from '@/components/Container';
import Link from 'next/link';
import Image from 'next/image';

export default function MoviesAndTv() {

  return (
    <div>
      <Container className='flex items-center justify-center h-screen flex-col gap-y-5'>
        <nav className="absolute top-10">
          <ul className="flex justify-end items-center gap-x-5">
            <li><Link href={"/movies-and-tv"}>Movies & TV</Link></li>
            <li><Link href={"/music"}>Music</Link></li>
            <li><Link href={"/games"}>Games</Link></li>
            <li><Link className="font-bold" href={"/books"}>Books</Link></li>
          </ul>
        </nav>
        <Link href={"/movies-and-tv"} className="flex items-center gap-x-3">
          <Image
            src="/icons/unicritic-logo.svg"
            alt="Unicritic Logo"
            width={39}
            height={44}
            priority
          />
          <h1>Unicritic</h1>
        </Link>
        <p className='mt-5 lg:mt-0 text-center'>Coming soon!</p>
      </Container>
    </div>
  );
}