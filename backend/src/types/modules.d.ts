// Comprehensive module declarations for deployment

// Comprehensive module declarations for deployment

declare module 'express' {
  import { IncomingMessage, ServerResponse } from 'http';
  import { ParsedQs } from 'qs';

  export interface Request<
    P = any,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    Locals extends Record<string, any> = Record<string, any>
  > extends IncomingMessage {
    body: ReqBody;
    cookies: any;
    method: string;
    params: P;
    query: ReqQuery;
    route: any;
    signedCookies: any;
    originalUrl: string;
    url: string;
    baseUrl: string;
    path: string;
    hostname: string;
    ip: string;
    ips: string[];
    protocol: string;
    secure: boolean;
    fresh: boolean;
    stale: boolean;
    xhr: boolean;
    connection: any;
    socket: any;
    user?: any;
    file?: any;
    files?: any;
    get(name: string): string | undefined;
    header(name: string): string | undefined;
    accepts(): string[];
    accepts(type: string): string | false;
    accepts(type: string[]): string | false;
    accepts(...type: string[]): string | false;
    acceptsCharsets(): string[];
    acceptsCharsets(charset: string): string | false;
    acceptsCharsets(charset: string[]): string | false;
    acceptsCharsets(...charset: string[]): string | false;
    acceptsEncodings(): string[];
    acceptsEncodings(encoding: string): string | false;
    acceptsEncodings(encoding: string[]): string | false;
    acceptsEncodings(...encoding: string[]): string | false;
    acceptsLanguages(): string[];
    acceptsLanguages(lang: string): string | false;
    acceptsLanguages(lang: string[]): string | false;
    acceptsLanguages(...lang: string[]): string | false;
    range(size: number, options?: any): any;
    param(name: string, defaultValue?: any): string;
    is(type: string | string[]): string | false | null;
    app: Application;
    res?: Response;
    next?: NextFunction;
  }

  export interface Response<ResBody = any, Locals extends Record<string, any> = Record<string, any>> extends ServerResponse {
    app: Application;
    headersSent: boolean;
    locals: Locals;
    req?: Request;
    charset: string;
    status(code: number): this;
    sendStatus(code: number): this;
    links(links: any): this;
    send: Send<ResBody, this>;
    json: Send<ResBody, this>;
    jsonp: Send<ResBody, this>;
    sendFile(path: string, fn?: any): void;
    sendFile(path: string, options: any, fn?: any): void;
    download(path: string, fn?: any): void;
    download(path: string, filename: string, fn?: any): void;
    download(path: string, filename: string, options: any, fn?: any): void;
    contentType(type: string): this;
    type(type: string): this;
    format(obj: any): this;
    attachment(filename?: string): this;
    set(field: any): this;
    set(field: string, value?: string | string[]): this;
    header(field: any): this;
    header(field: string, value?: string | string[]): this;
    get(field: string): string;
    clearCookie(name: string, options?: any): this;
    cookie(name: string, val: string, options: any): this;
    cookie(name: string, val: any, options?: any): this;
    cookie(name: string, val: any): this;
    location(url: string): this;
    redirect(url: string): void;
    redirect(status: number, url: string): void;
    redirect(url: string, status: number): void;
    render(view: string, options?: object, callback?: (err: Error, html: string) => void): void;
    render(view: string, callback?: (err: Error, html: string) => void): void;
    vary(field: string): this;
    append(field: string, value?: string[] | string): this;
  }

  export interface NextFunction {
    (err?: any): void;
    (deferToNext: 'router'): void;
    (deferToNext: 'route'): void;
  }

  export interface RequestHandler<
    P = any,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    Locals extends Record<string, any> = Record<string, any>
  > {
    (req: Request<P, ResBody, ReqBody, ReqQuery, Locals>, res: Response<ResBody, Locals>, next: NextFunction): void;
  }

  export interface ErrorRequestHandler<
    P = any,
    ResBody = any,
    ReqBody = any,
    ReqQuery = ParsedQs,
    Locals extends Record<string, any> = Record<string, any>
  > {
    (err: any, req: Request<P, ResBody, ReqBody, ReqQuery, Locals>, res: Response<ResBody, Locals>, next: NextFunction): void;
  }

  export interface Send<ResBody = any, T = Response<ResBody>> {
    (body?: ResBody): T;
  }

  export interface Application<Locals extends Record<string, any> = Record<string, any>> {
    use(...handlers: any[]): this;
    get(...handlers: any[]): this;
    post(...handlers: any[]): this;
    put(...handlers: any[]): this;
    delete(...handlers: any[]): this;
    patch(...handlers: any[]): this;
    options(...handlers: any[]): this;
    head(...handlers: any[]): this;
    all(...handlers: any[]): this;
    listen(port: number, hostname: string, backlog: number, callback?: () => void): any;
    listen(port: number, hostname: string, callback?: () => void): any;
    listen(port: number, callback?: () => void): any;
    listen(callback?: () => void): any;
    listen(path: string, callback?: () => void): any;
    listen(handle: any, listeningListener?: () => void): any;
    set(setting: string, val: any): this;
    get(name: string): any;
    enabled(setting: string): boolean;
    disabled(setting: string): boolean;
    enable(setting: string): this;
    disable(setting: string): this;
    locals: Locals;
    json(options?: any): RequestHandler;
    urlencoded(options?: any): RequestHandler;
    static(root: string, options?: any): RequestHandler;
  }

  export interface Router {
    use(...handlers: any[]): this;
    get(...handlers: any[]): this;
    post(...handlers: any[]): this;
    put(...handlers: any[]): this;
    delete(...handlers: any[]): this;
    patch(...handlers: any[]): this;
    options(...handlers: any[]): this;
    head(...handlers: any[]): this;
    all(...handlers: any[]): this;
  }

  export function Router(options?: any): Router;

  interface Express {
    (): any;
    json(options?: any): any;
    urlencoded(options?: any): any;
    static(root: string, options?: any): any;
    Router: any;
  }

  const express: Express;
  export = express;
}

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