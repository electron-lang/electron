import { PortDirection } from './common';
import { INot } from './digital';
import { IRes } from './analog';

describe('$not', () => {
    it('should have type INot', () => {
        const $not: INot = {
            type: '$not',
            parameters: {
                A_SIGNED: 0,
                A_WIDTH: 1,
                Y_WIDTH: 1
            },
            port_directions: {
                A: PortDirection.Input,
                Y: PortDirection.Output
            },
            connections: {
                A: [2],
                Y: [3]
            }
        }
    });
});

describe('$res', () => {
    it('should have type IRes', () => {
        const $res: IRes = {
            type: '$res',
            parameters: {
                RESISTANCE: '1k',
            },
            connections: {
                A: [2],
                B: [3]
            }
        }
    });
});
