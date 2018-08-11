export type CPLType = 'resistor' | 'capacitor' | 'led' | undefined
export class CPL {
    readonly type: CPLType
    readonly value: string | undefined
    readonly size: string | undefined

    static metricLookup: {[imp: string]: string} = {
        '008004': '0201',
        '009005': '03015',
        '01005': '0402',
        '0201': '0603',
        '0402': '1005',
        '0603': '1608',
        '0805': '2012',
        '1008': '2520',
        '1206': '3216',
        '1210': '3225',
        '1806': '4516',
        '1812': '4532',
        '1825': '4564',
        '2010': '5025',
        '2512': '6332',
        '2920': '7451',
    }

    constructor(readonly id: string) {
        const parts = this.id.split('-')
        if (id.startsWith('CPL-RES')) {
            this.type = 'resistor'
            this.value = parts[3] // Resistance
            this.size = parts[2] // Size
        } else if (id.startsWith('CPL-CAP')) {
            this.type = 'capacitor'
            this.value = parts[4] // Capacitance
            this.size = parts[3] // Size
        } else if (id.startsWith('CPL-LED')) {
            this.type = 'led'
            this.value = parts[3] // Color
            this.size = parts[2] // Size
        }
    }

    getFootprint(): string | undefined {
        const sizeMetric = CPL.metricLookup[this.size || '']

        switch (this.type) {
            case 'resistor':
                return `Resistor_SMD:R_${this.size}_${sizeMetric}Metric`
            case 'capacitor':
                return `Capacitor_SMD:C_${this.size}_${sizeMetric}Metric`
            case 'led':
                return `LED_SMD:LED_${this.size}_${sizeMetric}Metric`
        }
    }
}
