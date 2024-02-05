import React, { useState, useEffect } from "react";
import { Dropdown } from "semantic-ui-react";
import { withApollo } from "@apollo/client/react/hoc";
import ExportModal from "./ExportModal";
import Button from "../../components/Button";

import "../../App.css";

import { EXPORT_ENGINE } from "../../graphql/engine";

const dropdownOptions = [
  {
    key: "as json",
    text: "as json",
    value: "as json",
    selected: false,
  },
  {
    key: "as json file",
    text: "as json file",
    value: "as json file",
  },
];

const ExportDropdown = ({ engine, ...props }) => {
  const { id } = engine;

  const [json, setJson] = useState();
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    if (json) {
      setExportModalOpen(true);
    }
  }, [json]);

  const handleExportDropdownClick = async (value) => {
    const res = await props.client
      .query({
        query: EXPORT_ENGINE,
        variables: { id: id },
      })
      .catch((err) => {
        console.log(err);
      });
    if (value === "as json") {
      setJson(res.data.engine);
    }
    if (value === "as json file") {
      downloadObjectAsJson(res.data.engine, engine.id + ".json");
    }
  };

  // https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser/41553494
  const downloadObjectAsJson = (exportObj, exportName) => {
    var dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <>
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        json={json}
      />
      <Dropdown
        icon={null}
        value={null}
        selectOnBlur={false}
        pointing="top left"
        trigger={
          <Button
            darkenOnHover
            className=" hover margin-left-small text-small text-normal white-background black"
          >
            <span>Export</span>
          </Button>
        }
        options={dropdownOptions}
        onChange={(e, { value }) => handleExportDropdownClick(value)}
      />
    </>
  );
};

export default withApollo(ExportDropdown);
