import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

// React Router 7 usa estas APIs del navegador; jsdom no las incluye.
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
