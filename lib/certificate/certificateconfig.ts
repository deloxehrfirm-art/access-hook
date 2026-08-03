export interface LayoutElement {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: 'Normal' | 'Bold';
  color: string;
  textAlign: 'Center' | 'Left' | 'Right';
  fontFamily: 'Great Vibes' | 'Space Grotesk' | 'Playfair Display';
}

export interface CertificateConfig {
  canvas: {
    width: number;
    height: number;
  };
  studentName: LayoutElement;
  certificateId: LayoutElement;
  awardDate: LayoutElement;
  qrCode: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  courseNameDefault: string;
  urls: {
    greatVibes: string;
    spaceGrotesk: string;
    playfairDisplay: string;
  };
}

export const certificateConfig: CertificateConfig = {
  canvas: {
    width: 2000,
    height: 1414,
  },
  studentName: {
    x: 633,
    y: 627,
    width: 720,
    height: 99,
    fontSize: 84,
    fontWeight: 'Normal',
    color: '#000000',
    textAlign: 'Center',
    fontFamily: 'Great Vibes',
  },
  certificateId: {
    x: 1000,
    y: 770,
    width: 400,
    height: 40,
    fontSize: 25,
    fontWeight: 'Bold',
    color: '#000000',
    textAlign: 'Left',
    fontFamily: 'Space Grotesk',
  },
  awardDate: {
    x: 991,
    y: 840,
    width: 299,
    height: 40,
    fontSize: 25,
    fontWeight: 'Bold',
    color: '#000000',
    textAlign: 'Right',
    fontFamily: 'Playfair Display',
  },
  qrCode: {
    x: 60,
    y: 1120,
    width: 160,
    height: 192,
  },
  courseNameDefault: 'Workplace Readiness Profession Development',
  urls: {
    greatVibes: 'https://raw.githubusercontent.com/google/fonts/main/ofl/greatvibes/GreatVibes-Regular.ttf',
    spaceGrotesk: 'https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/static/SpaceGrotesk-Bold.ttf',
    playfairDisplay: 'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/static/PlayfairDisplay-Bold.ttf',
  },
};
