/* global owl */
import { DEVICE_ICONS } from "./components/dialog/DeviceDialog.js";

const { Component, mount, xml, useState } = owl;

class StatusPage extends Component {
    static props = {};

    setup() {
        this.state = useState({ data: {}, loading: true });
        this.icons = DEVICE_ICONS;

        this.loadInitialData();
        setInterval(() => {
            this.loadInitialData();
        }, 10000);
    }

    async loadInitialData() {
        try {
            const response = await fetch("/hw_posbox_homepage/data");
            this.state.data = await response.json();
            this.state.loading = false;
        } catch {
            console.warn("Error while fetching data");
        }
    }

    get accessPointSsid() {
        return this.state.data.network_interfaces.filter(i => i.is_wifi)[0]?.ssid;
    }

    static template = xml`
    <div t-if="!state.loading" class="container-fluid">
        <div class="text-center pt-5">
            <img class="odoo-logo" src="/web/static/img/logo2.png" alt="Odoo logo"/>
        </div>
        <!-- QR Codes shown on status page -->
        <div class="qr-code-box">
            <div class="status-display-box qr-code">
                <div>
                    <h4 class="text-center mb-1">IoT Box Configuration</h4>
                    <hr/>
                    <!-- If the IoT Box is connected to internet -->
                    <div t-if="!state.data.is_access_point_up and state.data.qr_code_url">
                        <p>
                            1. Connect to
                            <!-- Only wifi connection is shown as ethernet connections look like "Wired connection 2" -->
                            <t t-if="state.data.wifi_ssid">
                                <b>
                                    <t t-out="state.data.wifi_ssid"/>
                                </b>
                            </t>
                            <t t-else=""> the IoT Box network</t>
                            <br/>
                            <br/>
                            <div t-if="state.data.qr_code_wifi" class="qr-code">
                                <img t-att-src="state.data.qr_code_wifi" alt="QR Code Wi-FI"/>
                            </div>
                        </p>
                        <p>
                            2. Open the IoT Box setup page
                            <br/>
                            <br/>
                            <div class="qr-code">
                                <img t-att-src="state.data.qr_code_url" alt="QR Code Homepage"/>
                            </div>
                        </p>
                    </div>
                    <!-- If the IoT Box is in access point and not connected to internet yet -->
                    <div t-elif="state.data.is_access_point_up and state.data.qr_code_url and state.data.qr_code_url"> 
                        <p>1. Connect to the IoT Box network</p>
                        <div class="qr-code">
                            <img t-att-src="state.data.qr_code_wifi" alt="QR Code Access Point"/>
                        </div>
                        <br/>
                        <br/>
                        <p>2. Configure Wi-Fi connection</p>
                        <div class="qr-code">
                            <img t-att-src="state.data.qr_code_url" alt="QR Code Wifi Config"/>
                        </div>
                        <br/>
                        <br/>
                    </div>
                </div>
            </div>
        </div>
        <div class="status-display-boxes">
            <div t-if="state.data.pairing_code and !state.data.is_access_point_up" class="status-display-box">
                <h4 class="text-center mb-3">Pairing Code</h4>
                <hr/>
                <h4 t-out="state.data.pairing_code" class="text-center mb-3"/>
            </div>
            <div t-if="state.data.is_access_point_up and accessPointSsid" class="status-display-box">
                <h4 class="text-center mb-3">No Internet Connection</h4>
                <hr/>
                <p class="mb-3">
                    Please connect your IoT Box to internet via an ethernet cable or connect to Wi-FI network<br/>
                    <a class="alert-link" t-out="accessPointSsid" /><br/>
                    to configure a Wi-Fi connection on the IoT Box
                </p>
            </div>
            <div class="status-display-box">
                <h4 class="text-center mb-3">Status display</h4>
                
                <h5 class="mb-1">General</h5>
                <table class="table table-hover table-sm">
                    <tbody>
                        <tr>
                            <td class="col-3"><i class="me-1 fa fa-fw fa-id-card"/>Name</td>
                            <td class="col-3" t-out="state.data.hostname"/>
                        </tr>
                    </tbody>
                </table>
                
                <h5 class="mb-1" t-if="state.data.network_interfaces.length > 0">Internet Connection</h5>
                <table class="table table-hover table-sm" t-if="state.data.network_interfaces.length > 0">
                    <tbody>
                        <tr t-foreach="state.data.network_interfaces" t-as="interface" t-key="interface.id">
                            <td class="col-3"><i t-att-class="'me-1 fa fa-fw fa-' + (interface.is_wifi ? 'wifi' : 'sitemap')"/><t t-out="interface.is_wifi ? interface.ssid : 'Ethernet'"/></td>
                            <td class="col-3" t-out="interface.ip"/>
                        </tr>
                    </tbody>
                </table>
                <div t-if="Object.keys(state.data.devices).length > 0">
                    <h5 class="mb-1">Devices</h5>
                    <table class="table table-hover table-sm">
                        <tbody>
                            <tr t-foreach="Object.keys(state.data.devices)" t-as="deviceType" t-key="deviceType">
                                <td class="device-type col-3">
                                    <i t-att-class="'me-1 fa fa-fw fa- ' + icons[deviceType]"/>
                                    <t t-out="deviceType.replaceAll('_', ' ') + 's'" />
                                </td>
                                <td class="col-3">
                                    <ul>
                                        <li t-foreach="state.data.devices[deviceType].slice(0, 10)" t-as="device" t-key="device.identifier">
                                            <t t-out="device.name"/>
                                        </li>
                                        <li t-if="state.data.devices[deviceType].length > 10">...</li>
                                    </ul>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;
}

mount(StatusPage, document.body);
