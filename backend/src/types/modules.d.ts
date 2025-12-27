// Comprehensive module declarations for deployment

declare module 'cors' {
  import { RequestHandler } from 'express';

  interface CorsOptions {
    origin?: boolean | string | RegExp | (string | RegExp)[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }

  function cors(options?: CorsOptions): RequestHandler;
  export = cors;
}

declare module 'bcrypt' {
  export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  export function hashSync(data: string | Buffer, saltOrRounds: string | number): string;
  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>;
  export function compareSync(data: string | Buffer, encrypted: string): boolean;
  export function genSalt(rounds?: number): Promise<string>;
  export function genSaltSync(rounds?: number): string;
  export function getRounds(encrypted: string): number;
}

declare module 'jsonwebtoken' {
  export interface SignOptions {
    algorithm?: string;
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    subject?: string;
    issuer?: string;
    jwtid?: string;
    mutatePayload?: boolean;
    noTimestamp?: boolean;
    header?: object;
    encoding?: string;
  }

  export interface VerifyOptions {
    algorithms?: string[];
    audience?: string | RegExp | (string | RegExp)[];
    clockTolerance?: number;
    issuer?: string | string[];
    ignoreExpiration?: boolean;
    ignoreNotBefore?: boolean;
    jwtid?: string;
    subject?: string;
    clockTimestamp?: number;
    nonce?: string;
    maxAge?: string | number;
  }

  export interface JwtPayload {
    [key: string]: any;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
  }

  export class JsonWebTokenError extends Error {
    name: 'JsonWebTokenError';
  }

  export class TokenExpiredError extends JsonWebTokenError {
    name: 'TokenExpiredError';
    expiredAt: Date;
  }

  export class NotBeforeError extends JsonWebTokenError {
    name: 'NotBeforeError';
    date: Date;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: SignOptions
  ): string;

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    callback: (err: Error | null, encoded: string | undefined) => void
  ): void;

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options: SignOptions,
    callback: (err: Error | null, encoded: string | undefined) => void
  ): void;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: VerifyOptions
  ): JwtPayload | string;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    callback: (err: JsonWebTokenError | null, decoded: JwtPayload | string | undefined) => void
  ): void;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options: VerifyOptions,
    callback: (err: JsonWebTokenError | null, decoded: JwtPayload | string | undefined) => void
  ): void;

  export function decode(token: string, options?: { complete?: boolean; json?: boolean }): null | JwtPayload | string | { header: any; payload: JwtPayload | string; signature: string };
}

declare module 'multer' {
  import { Request, RequestHandler } from 'express';
  import { Readable } from 'stream';

  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
    stream: Readable;
  }

  interface StorageEngine {
    _handleFile(req: Request, file: File, callback: (error?: any, info?: Partial<File>) => void): void;
    _removeFile(req: Request, file: File, callback: (error: Error | null) => void): void;
  }

  interface DiskStorageOptions {
    destination?: string | ((req: Request, file: File, callback: (error: Error | null, destination: string) => void) => void);
    filename?: (req: Request, file: File, callback: (error: Error | null, filename: string) => void) => void;
  }

  interface Options {
    dest?: string;
    storage?: StorageEngine;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    preservePath?: boolean;
    fileFilter?: FileFilterCallback;
  }

  interface FileFilterCallback {
    (req: Request, file: File, callback: (error: Error | null, acceptFile: boolean) => void): void;
  }

  interface Instance {
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler;
    none(): RequestHandler;
    any(): RequestHandler;
  }

  interface Multer {
    (options?: Options): Instance;
    memoryStorage(): StorageEngine;
    diskStorage(options: DiskStorageOptions): StorageEngine;
    MulterError: MulterErrorConstructor;
  }

  interface MulterError extends Error {
    code: string;
    field?: string;
  }

  interface MulterErrorConstructor {
    new (code: string, field?: string): MulterError;
    readonly prototype: MulterError;
  }

  const multer: Multer;
  export = multer;
}