import React from "react";
import { Tab } from "semantic-ui-react";
import CreateAPIKey from "./CreateAPIKey";
import UpdateAPIKey from "./UpdateAPIKey";
import Header from "../../components/Header";
import ContentWrapper from "../../components/ContentWrapper";

const Keys = () => {
  const panes = [
    {
      menuItem: "Create",
      render: () => (
        <Tab.Pane>
          <CreateAPIKey />
        </Tab.Pane>
      ),
    },
    {
      menuItem: "Update",
      render: () => (
        <Tab.Pane>
          <UpdateAPIKey />
        </Tab.Pane>
      ),
    },
  ];

  return (
    <ContentWrapper>
      <Header className="text-large text-bold black">
        <div className="margin-left-tiny">API Key Management</div>
      </Header>
      <Tab panes={panes} />
    </ContentWrapper>
  );
};

export default Keys;
