import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { standardWidgetProps } from "@web/views/widgets/standard_widget_props";
import { FileUploader } from "@web/views/fields/file_handler";

import { Component } from "@odoo/owl";

export class PurchaseFileUploader extends Component {
    static template = "purchase.DocumentFileUploader";
    static props = {
        ...standardWidgetProps,
        record: { type: Object, optional: true },
        list: { type: Object, optional: true },
    };
    static components = { FileUploader };

    setup() {
        this.orm = useService("orm");
        this.action = useService("action");
        this.attachmentIdsToProcess = [];
    }

    get resModel() {
        return "purchase.order";
    }

    get records() {
        return this.props.record ? [this.props.record] : this.props.list.records;
    }

    async getIds() {
        if (this.props.record) {
            return this.props.record.data.id;
        }
        return this.props.list.getResIds(true);
    }

    async onFileUploaded(file) {
        const att_data = {
            name: file.name,
            mimetype: file.type,
            datas: file.data,
        };
        const [att_id] = await this.orm.create("ir.attachment", [att_data], {
            context: { ...this.env.searchModel.context },
        });
        this.attachmentIdsToProcess.push(att_id);
    }

    async onUploadComplete() {
        const resModel = this.resModel;
        const ids = await this.getIds();
        let action;
        try {
            action = await this.orm.call(
                resModel,
                "action_create_invoice",
                [ids, this.attachmentIdsToProcess],
                { context: { ...this.env.searchModel.context } }
            );
        } finally {
            // ensures attachments are cleared on success as well as on error
            this.attachmentIdsToProcess = [];
        }
        this.action.doAction(action);
    }
}

export const purchaseFileUploader = {
    component: PurchaseFileUploader,
};

registry.category("view_widgets").add("purchase_file_uploader", purchaseFileUploader);
