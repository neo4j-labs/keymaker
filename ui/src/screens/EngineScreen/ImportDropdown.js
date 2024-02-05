import React, { useState } from "react";
import { Dropdown } from "semantic-ui-react";

import Button from "../../components/Button";
import ImportModal from "./ImportModal";

import "../../App.css";

const dropdownOptions = [
  {
    key: "from json",
    text: "from json",
    value: "from json",
    selected: false,
  },
];

const ImportDropdown = ({ engine }) => {
  const { id } = engine;

  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleImportDropdownClick = async (value) => {
    if (value === "from json") {
      setImportModalOpen(true);
    }
  };

  return (
    <>
      <ImportModal
        engineID={id}
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
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
            <span>Import</span>
          </Button>
        }
        options={dropdownOptions}
        onChange={(_, { value }) => handleImportDropdownClick(value)}
      />
    </>
  );
};

export default ImportDropdown;
