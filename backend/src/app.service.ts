import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'Demo Voice Agent',
      description:
        'Pre-charge-off AI voice agent demo for Chase Card Services credit card collections.',
    };
  }

  getHealth() {
    return { status: 'ok' };
  }
}
