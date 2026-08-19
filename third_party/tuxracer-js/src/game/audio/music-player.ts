import { Howl } from "howler";

export class MusicPlayer {
  private racingMusic: Howl;
  private winningMusic: Howl;
  private losingMusic: Howl;

  public init(): void {
    this.racingMusic = new Howl({
      src: ["assets/music/racing.mp3"],
      loop: true,
    });
    this.winningMusic = new Howl({
      src: ["assets/music/winning.mp3"],
      loop: true,
    });
    this.losingMusic = new Howl({
      src: ["assets/music/losing.mp3"],
      loop: true,
    });
  }

  public playRacingMusic(): void {
    this.winningMusic.stop();
    this.losingMusic.stop();
    this.racingMusic.play();
  }

  public playWinningMusic(): void {
    this.winningMusic.play();
    this.losingMusic.stop();
    this.racingMusic.stop();
  }

  public playLosingMusic(): void {
    this.winningMusic.stop();
    this.losingMusic.play();
    this.racingMusic.stop();
  }

  public fadeOut(duration: number): void {
    if (this.winningMusic.playing()) {
      this.winningMusic.fade(this.winningMusic.volume(), 0, duration);
    }
    if (this.losingMusic.playing()) {
      this.losingMusic.fade(this.losingMusic.volume(), 0, duration);
    }
    if (this.racingMusic.playing()) {
      this.racingMusic.fade(this.racingMusic.volume(), 0, duration);
    }
  }
}
