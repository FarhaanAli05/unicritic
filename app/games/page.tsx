"use client";

import Container from "@/components/Container";
import Link from "next/link";
import Image from "next/image";

export default function MoviesAndTv() {
  return (
    <div>
      <Container className="flex h-screen flex-col items-center justify-center gap-y-5">
        <nav className="absolute top-10">
          <ul className="flex items-center justify-end gap-x-5">
            <li>
              <Link href={"/movies-and-tv"}>Movies & TV</Link>
            </li>
            <li>
              <Link href={"/music"}>Music</Link>
            </li>
            <li>
              <Link className="font-bold" href={"/games"}>
                Games
              </Link>
            </li>
            <li>
              <Link href={"/books"}>Books</Link>
            </li>
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
        <p className="mt-5 text-center lg:mt-0">Coming soon!</p>
      </Container>
    </div>
  );
}
