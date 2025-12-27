declare module 'supertest' {
  import { Application } from 'express';
  import { Server } from 'http';

  interface Response {
    status: number;
    text: string;
    body: any;
    header: { [key: string]: string };
    headers: { [key: string]: string };
    get(field: string): string;
  }

  interface Test {
    expect(status: number): Test;
    expect(status: number, callback: (err: any, res: Response) => void): Test;
    expect(field: string, val: string | RegExp): Test;
    expect(field: string, val: string | RegExp, callback: (err: any, res: Response) => void): Test;
    expect(callback: (res: Response) => void): Test;
    end(callback?: (err: any, res: Response) => void): Test;
    send(data?: any): Test;
    query(data: object): Test;
    field(name: string, val: string): Test;
    set(field: string, val: string): Test;
    set(field: object): Test;
    type(val: string): Test;
    accept(val: string): Test;
    timeout(ms: number): Test;
    redirects(n: number): Test;
    buffer(val?: boolean): Test;
    parse(fn: (res: Response, callback: (err: Error | null, body: any) => void) => void): Test;
    auth(user: string, pass: string): Test;
    ca(cert: string | string[] | Buffer | Buffer[]): Test;
    cert(cert: string | string[] | Buffer | Buffer[]): Test;
    key(key: string | string[] | Buffer | Buffer[]): Test;
    pfx(pfx: string | Buffer): Test;
    attach(field: string, file: string | Buffer, filename?: string): Test;
    then(resolve?: (res: Response) => void, reject?: (err: any) => void): Promise<Response>;
  }

  interface SuperTest<T> {
    get(url: string): T;
    post(url: string): T;
    put(url: string): T;
    patch(url: string): T;
    head(url: string): T;
    del(url: string): T;
    delete(url: string): T;
    options(url: string): T;
    trace(url: string): T;
    copy(url: string): T;
    lock(url: string): T;
    mkcol(url: string): T;
    move(url: string): T;
    purge(url: string): T;
    propfind(url: string): T;
    proppatch(url: string): T;
    unlock(url: string): T;
    report(url: string): T;
    mkactivity(url: string): T;
    checkout(url: string): T;
    merge(url: string): T;
    'm-search'(url: string): T;
    notify(url: string): T;
    subscribe(url: string): T;
    unsubscribe(url: string): T;
    search(url: string): T;
    connect(url: string): T;
  }

  function request(app: Application | Server | string): SuperTest<Test>;
  export = request;
}